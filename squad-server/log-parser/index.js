import fs from 'fs';
import path from 'path';
import readline from 'readline';

import moment from 'moment';
import TailModule from 'tail';

import ConnectionHandler from './utils/connection-handler.js';
import InjuryHandler from './utils/injury-handler.js';
import rules from './rules/index.js';

const { Tail } = TailModule;

export default class LogParser {
  constructor(server) {
    this.server = server;

    this.connectionHandler = new ConnectionHandler();
    this.injuryHandler = new InjuryHandler();

    this.setup();
  }

  setup() {
    if (this.server.logParserTestMode) {
      /* In test mode, we stream a log file line by line to simulate tail */
      this.reader = readline.createInterface({
        input: fs.createReadStream(
          path.join(this.server.logParserLogDir, 'SquadGame.log')
        )
      });
      this.reader.pause();
    } else {
      /* In normal mode, we tail the file to get new lines as and when they are added */
      this.reader = new Tail(
        path.join(this.server.logParserLogDir, 'SquadGame.log'),
        {
          useWatchFile: true
        }
      );
    }
    this.reader.on('line', this.handleLine.bind(this));
  }

  watch() {
    if (this.server.logParserTestMode) {
      this.reader.resume();
    } else {
      this.reader.watch();
    }
  }

  unwatch() {
    if (this.server.logParserTestMode) {
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
