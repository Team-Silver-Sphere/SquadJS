import EventEmitter from 'events';

import async from 'async';
import moment from 'moment';

import Logger from '../logger.js';

import TailLogReader from './log-readers/tail.js';
import SFTPLogReader from './log-readers/sftp.js';
import FTPLogReader from './log-readers/ftp.js';

export default class LogParser extends EventEmitter {
  constructor(filename = 'filename.log', options = {}) {
    super();

    options.filename = filename;

    this.eventStore = {
      disconnected: {}, // holding area, cleared on map change.
      players: {}, // persistent data, steamid, controller, suffix.
      session: {}, // old eventstore, nonpersistent data
      joinRequests: []
    };

    this.linesPerMinute = 0;
    this.matchingLinesPerMinute = 0;
    this.matchingLatency = 0;
    this.parsingStatsInterval = null;

    this.processLine = this.processLine.bind(this);
    this.logStats = this.logStats.bind(this);

    this.queue = async.queue(this.processLine);

    switch (options.mode || 'tail') {
      case 'tail':
        this.logReader = new TailLogReader(this.queue.push, options);
        break;
      case 'sftp':
        this.logReader = new SFTPLogReader(this.queue.push, options);
        break;
      case 'ftp':
        this.logReader = new FTPLogReader(this.queue.push, options);
        break;
      default:
        throw new Error('Invalid mode.');
    }
  }

  async processLine(line) {
    Logger.verbose('LogParser', 4, `Matching on line: ${line}`);

    for (const rule of this.getRules()) {
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
  }

  // manage cleanup disconnected players, session data.
  clearEventStore() {
    Logger.verbose('LogParser', 2, 'Cleaning Eventstore');
    for (const player of Object.values(this.eventStore.players)) {
      if (this.eventStore.disconnected[player.eosID] === true) {
        Logger.verbose('LogParser', 2, `Removing ${player.eosID} from eventStore`);
        delete this.eventStore.players[player.eosID];
        delete this.eventStore.disconnected[player.eosID];
      }
    }
    this.eventStore.session = {};
  }

  getRules() {
    return [];
  }

  async watch() {
    Logger.verbose('LogParser', 1, 'Attempting to watch log file...');
    await this.logReader.watch();
    Logger.verbose('LogParser', 1, 'Watching log file...');

    this.parsingStatsInterval = setInterval(this.logStats, 60 * 1000);
  }

  logStats() {
    Logger.verbose(
      'LogParser',
      1,
      `Lines parsed per minute: ${
        this.linesPerMinute
      } lines per minute | Matching lines per minute: ${
        this.matchingLinesPerMinute
      } matching lines per minute | Average matching latency: ${
        this.matchingLatency / this.matchingLinesPerMinute
      }ms`
    );
    this.linesPerMinute = 0;
    this.matchingLinesPerMinute = 0;
    this.matchingLatency = 0;
  }

  async unwatch() {
    await this.logReader.unwatch();

    clearInterval(this.parsingStatsInterval);
  }
}
