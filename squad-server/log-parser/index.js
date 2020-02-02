import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

import moment from 'moment';
import TailModule from 'tail';

import InjuryManager from './utils/injury-manager.js';
import rules from './rules/index.js';

const { Tail } = TailModule;

export default class LogParser extends EventEmitter {
  constructor(options = {}) {
    super();

    if (!options.logDir) throw new Error('Log Folder not specified');
    this.logFile = path.join(options.logDir, 'SquadGame.log');

    this.testMode = options.testMode || false;

    this.injuryManager = new InjuryManager();

    this.setup();
  }

  setup() {
    if (this.testMode) {
      /* In test mode, we stream a log file line by line to simulate tail */
      this.reader = readline.createInterface({
        input: fs.createReadStream(this.logFile)
      });
      this.reader.pause();
    } else {
      /* In normal mode, we tail the file to get new lines as and when they are added */
      this.reader = new Tail(this.logFile, {
        useWatchFile: true
      });
    }
    this.reader.on('line', this.handleLine.bind(this));
  }

  watch() {
    if (this.testMode) {
      this.reader.resume();
    } else {
      this.reader.watch();
    }
  }

  unwatch() {
    if (this.testMode) {
      this.reader.pause();
    } else {
      this.reader.unwatch();
    }
  }

  handleLine(line) {
    let canBreak = false;

    for (const rule of rules) {
      if (rule === 'END_NO_MATCH_ACTION') {
        canBreak = true;
        continue;
      }

      const match = line.match(rule.regex);

      if (match) {
        match[1] = moment(match[1], 'YYYY.MM.DD-hh.mm.ss:SSS').toDate();
        match[2] = parseInt(match[2]);
        rule.action(match, this);
        if (canBreak) break;
      } else {
        if (rule.noMatchAction) rule.noMatchAction(this);
      }
    }
  }
}
