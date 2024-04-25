import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import EventEmitter from 'events';

import async from 'async';
import moment from 'moment';

import Logger from '../logger.js';

import TailModule from 'tail';
import FTPTail from 'ftp-tail';

/**
 * @typedef { object } Rule
 * @property { RegExp } regex
 * @property { (args: RegExpMatchArray, logParser: unknown) => logParser is LogParser } onMatch
 */

/**
 * @typedef { object[] } RuleArr
 * @property { Rule } rule
 * @property { RegExpMatchArray } match
 */

/** @type { RuleArr } */
const addedLines = [];

const Tail = TailModule.Tail;

/**
 * Checks if `structure` file contains valid `regex` and `onMatch`
 * @param {*} structure
 * @returns {boolean}
 */
const predicate = (structure) =>
  Boolean(structure) &&
  typeof structure === 'object' &&
  'regex' in structure &&
  'onMatch' in structure &&
  RegExp(structure.regex) &&
  typeof structure.onMatch === 'function';

export default class LogParser extends EventEmitter {
  constructor(options = {}) {
    super();

    if (!('filename' in options)) {
      options.filename = 'SquadGame.log';
    }

    this.rules = [];
    this.options = options;
    this.eventStore = {
      disconnected: {}, // holding area, cleared on map change.
      players: [], // persistent data, steamid, controller, suffix.
      playersEOS: [], // proxies from EOSID to persistent data, steamid, controller, suffix.
      connectionIdToSteamID: new Map(),
      session: {}, // old eventstore, nonpersistent data
      clients: {}, // used in the connection chain before we resolve a player.
      lastConnection: {}, // used to store the last client connection data to then associate a steamid
      joinRequests: []
    };

    this.linesPerMinute = 0;
    this.matchingLinesPerMinute = 0;
    this.matchingLatency = 0;
    this.parsingStatsInterval = null;

    this.processLine = this.processLine.bind(this);
    this.logStats = this.logStats.bind(this);

    this.queue = async.queue(this.processLine);

    this.setup();
  }

  async setup() {
    /**
     * @type { Rule[] } Load all
     */
    this.rules = await this.loadFiles(new URL('log-events/', import.meta.url));
    if (this.rules.length === 0) {
      throw new Error('Unable to find valid files in "log-events" folder');
    }
    switch (this.options.mode || 'tail') {
      case 'tail':
        // Verify Tail requirements
        if (!('logDir' in this.options)) {
          throw new Error('logDir must be specified.');
        }
        // Provide only the filename and use fs.watchFile instead of fs.watch
        this.logReader = new Tail(path.join(this.options.logDir, this.options.filename), {
          useWatchFile: true
        });
        this.logReader.on('line', this.queue.push);
        break;
      case 'ftp':
        // Verify FTPTail requirements
        for (const option of ['host', 'user', 'password', 'logDir']) {
          if (!(option in this.options)) {
            throw new Error(`${option} must be specified.`);
          }
        }
        // Provide only FTPTail options
        this.logReader = new FTPTail({
          host: this.options.host,
          port: this.options.port || 21,
          user: this.options.user,
          password: this.options.password,
          secure: this.options.secure || false,
          timeout: this.options.timeout || 2000,
          encoding: 'utf8',
          verbose: this.options.verbose,

          path: path.join(this.options.logDir, this.options.filename),

          fetchInterval: this.options.fetchInterval || 0,
          maxTempFileSize: this.options.maxTempFileSize || 5 * 1000 * 1000, // 5 MB

          useListForSize: this.options.useListForSize || false
        });
        this.logReader.on('line', this.queue.push);
        break;
      default:
        throw new Error('Invalid mode.');
    }
  }

  /**
   * Loads all the files in the provided directory.
   *
   * @template T
   * @param {import('node:fs').PathLike} dir - The directory to load the files from
   * @param {boolean} recursive - Whether to recursively load the files in the directory
   * @returns {Promise<T[]>}
   */
  async loadFiles(dir, recursive = true) {
    const statDir = await fs.promises.stat(dir);
    if (!statDir.isDirectory()) {
      throw new Error(`The directory '${dir}' is not a directory.`);
    }
    const files = await fs.promises.readdir(dir);
    /** @type {T[]} */
    const structures = [];
    for (const file of files) {
      // We only want .js files
      if (file === 'index.js' || !file.endsWith('.js')) {
        continue;
      }
      const statFile = await fs.promises.stat(new URL(`${dir}/${file}`));
      if (statFile.isDirectory() && recursive) {
        structures.push(...(await this.loadFiles(`${dir}/${file}`, recursive)));
        continue;
      }
      const structure = (await import(`${dir}/${file}`)).default;
      if (predicate(structure)) {
        /**
         * Prevent file from being added if it contains `disabled: true`
         * Useful when testing or if the file contains errors
         */
        if (
          'disabled' in structure &&
          typeof structure.disabled === 'boolean' &&
          structure.disabled
        )
          continue;
        structures.push(structure);
      }
    }

    return structures;
  }

  /**
   * @param { string } line
   * @returns { Promise<void> }
   */
  async processLine(line) {
    Logger.verbose('LogParser', 4, `Matching on line: ${line}`);

    let i = this.rules.length;
    while (i--) {
      const rule = this.rules[i];
      const match = line.match(rule.regex);
      if (!match) continue;

      Logger.verbose('LogParser', 3, `Matched on line: ${match[0]}`);

      addedLines.push({ rule, match });
    }
    if (addedLines.length === 0) return;
    this.onLine(addedLines);
    addedLines.length = 0;
  }

  /**
   * @param { RuleArr } addedLine
   */
  onLine(addedLine) {
    this.linesPerMinute += 1;

    let i = addedLine.length;
    while (i--) {
      const { rule, match } = addedLine[i];
      match[1] = moment.utc(match[1], 'YYYY.MM.DD-hh.mm.ss:SSS').toDate();
      match[2] = parseInt(match[2]);

      /**
       * Prevent SquadJS from dying
       * Might cause a loop if an error occurs??? Needs testing.
       */
      // try {
      //   rule.onMatch(match, this);
      // } catch (ex) {
      //   Logger.verbose('LogParser', 1, 'Error', ex);
      // }

      rule.onMatch(match, this);

      this.matchingLinesPerMinute += 1;
      this.matchingLatency += Date.now() - match[1];
    }
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

  async watch() {
    Logger.verbose('LogParser', 1, 'Attempting to watch log file...');
    // FTPTails.watch is async while Tails.watch is not
    if (this.logReader.watch instanceof Promise) {
      await this.logReader.watch();
    } else {
      await Promise.resolve(this.logReader.watch());
    }
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
        Number.isNaN(this.matchingLatency / this.matchingLinesPerMinute)
          ? 0
          : this.matchingLatency / this.matchingLinesPerMinute
      }ms`
    );
    this.linesPerMinute = 0;
    this.matchingLinesPerMinute = 0;
    this.matchingLatency = 0;
  }

  async unwatch() {
    // FTPTails.unwatch is async while Tails.unwatch is not
    if (this.logReader.unwatch instanceof Promise) {
      await this.logReader.unwatch();
    } else {
      await Promise.resolve(this.logReader.unwatch());
    }

    clearInterval(this.parsingStatsInterval);
  }

  getRules() {
    return this.rules;
  }
}
