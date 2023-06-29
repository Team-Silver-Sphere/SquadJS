import EventEmitter from 'events';

import async from 'async';
import moment from 'moment';

import Logger from '../logger.js';

import TailLogReader from './log-readers/tail.js';
import FTPLogReader from './log-readers/ftp.js';

const addedLines = [];

export default class LogParser extends EventEmitter {
  constructor(filename = 'filename.log', options = {}) {
    super();

    options.filename = filename;

    this.eventStore = {
      disconnected: {}, // holding area, cleared on map change.
      players: {}, // persistent data, steamid, controller, suffix.
      session: {}, // old eventstore, nonpersistent data
      clients: {} // used in the connection chain before we resolve a player.
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
      case 'ftp':
        this.logReader = new FTPLogReader(this.queue.push, options);
        break;
      default:
        throw new Error('Invalid mode.');
    }
  }

  async processLine(line) {
    Logger.verbose('LogParser', 4, `Matching on line: ${line}`);

    let i = this.getRules().length;
    while (i--) {
      const rule = this.getRules()[i];
      const match = line.match(rule.regex);
      if (!match) continue;
      addedLines.push({ rule, match });
    }
    this.linesPerMinute += 1;
    this.onLine(addedLines);
    addedLines.length = 0;
  }
	
	onLine(addedLine) {
    for(const ad of addedLine) {
      const { rule, match } = ad;
      Logger.verbose('LogParser', 3, `Matched on line: ${match[0]}`);
      match[1] = moment.utc(match[1], 'YYYY.MM.DD-hh.mm.ss:SSS').toDate();
      match[2] = parseInt(match[2]);
      rule.onMatch(match, this);
      this.matchingLinesPerMinute += 1;
      this.matchingLatency +=  Number(Date.now()) - match[1];
    };
  }

  // manage cleanup disconnected players, session data.
  clearEventStore() {
    Logger.verbose('LogParser', 2, 'Cleaning Eventstore');
    for (const player of Object.values(this.eventStore.players)) {
      if (this.eventStore.disconnected[player.steamID] === true) {
        Logger.verbose('LogParser', 2, `Removing ${player.steamID} from eventStore`);
        delete this.eventStore.players[player.steamID];
        delete this.eventStore.disconnected[player.steamID];
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
        Number.isNaN(this.matchingLatency / this.matchingLinesPerMinute) ? 0 : this.matchingLatency / this.matchingLinesPerMinute
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
