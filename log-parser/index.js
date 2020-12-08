import EventEmitter from 'events';

import async from 'async';
import moment from 'moment';

import Logger from 'core/logger';

import TailLogReader from './log-readers/tail.js';
import FTPLogReader from './log-readers/ftp.js';

import rules from './rules/index.js';

export default class LogParser extends EventEmitter {
  constructor(options = {}) {
    super();

    this.eventStore = {};

    this.linesPerMinute = 0;
    this.matchingLinesPerMinute = 0;
    this.matchingLatency = 0;
    this.parsingStatsInterval = null;

    this.queue = async.queue(async (line) => {
      Logger.verbose('LogParser', 4, `Matching on line: ${line}`);

      for (const rule of rules) {
        const match = line.match(rule.regex);
        if (!match) continue;

        Logger.verbose('LogParser', 3, `Matched on line: ${match[0]}`);

        match[1] = moment.utc(match[1], 'YYYY.MM.DD-hh.mm.ss:SSS').toDate();
        match[2] = parseInt(match[2]);

        rule.onMatch(match, this);

        this.matchingLinesPerMinute++;
        this.matchingLatency += Date.now() - match[1];

        break;
      }

      this.linesPerMinute++;
    });

    switch (options.mode || 'tail') {
      case 'tail':
        this.logReader = new TailLogReader(this.queue.push, options);
        break;
      case 'ftp':
        this.logReader = new FTPLogReader(this.queue.push, options);
        break;
      default:
        throw new Error('Invalid mode.');
    }
  }

  async watch() {
    Logger.verbose('LogParser', 1, 'Attempting to watch log file...');
    await this.logReader.watch();
    Logger.verbose('LogParser', 1, 'Watching log file...');

    this.parsingStatsInterval = setInterval(() => {
      if(!(this.matchingLatency / this.matchingLinesPerMinute)) {
        Logger.verbose(
          'LogParser',
          1,
          `No logs has been parsed`
        );
      } else {
        Logger.verbose(
          'LogParser',
          1,
          `Lines parsed per minute: ${
            this.linesPerMinute
          } lines per minute | Matching lines per minute: ${
            this.matchingLinesPerMinute
          } matching lines per minute | Average matching latency: ${
            this.matchingLatency / this.matchingLinesPerMinute + "ms"
          }`
        );
      }
      this.linesPerMinute = 0;
      this.matchingLinesPerMinute = 0;
      this.matchingLatency = 0;
    }, 60 * 1000);
  }

  async unwatch() {
    await this.logReader.unwatch();

    clearInterval(this.parsingStatsInterval);
  }
}