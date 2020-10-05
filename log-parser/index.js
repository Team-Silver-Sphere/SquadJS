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

    this.queueLine = this.queueLine.bind(this);
    this.handleLine = this.handleLine.bind(this);
    this.queue = async.queue(this.handleLine);

    switch (options.mode || 'tail') {
      case 'tail':
        this.logReader = new TailLogReader(this.queueLine, options);
        break;
      case 'ftp':
        this.logReader = new FTPLogReader(this.queueLine, options);
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

  queueLine(line) {
    this.queue.push(line);
  }

  async handleLine(line) {
    for (const rule of rules) {
      const match = line.match(rule.regex);
      if (!match) continue;

      match[1] = moment.utc(match[1], 'YYYY.MM.DD-hh.mm.ss:SSS').toDate();
      match[2] = parseInt(match[2]);
      await rule.onMatch(match, this);
      break;
    }
  }
}
