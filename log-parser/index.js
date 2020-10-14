import EventEmitter from 'events';

import async from 'async';
import moment from 'moment';

import TailLogReader from './log-readers/tail.js';
import FTPLogReader from './log-readers/ftp.js';

import rules from './rules/index.js';

export default class LogParser extends EventEmitter {
  constructor(options = {}) {
    super();

    this.eventStore = {};

    this.queue = async.queue(async (line) => {
      for (const rule of rules) {
        const match = line.match(rule.regex);
        if (!match) continue;

        match[1] = moment.utc(match[1], 'YYYY.MM.DD-hh.mm.ss:SSS').toDate();
        match[2] = parseInt(match[2]);
        rule.onMatch(match, this);
        break;
      }
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
    await this.logReader.watch();
  }

  async unwatch() {
    await this.logReader.unwatch();
  }
}
