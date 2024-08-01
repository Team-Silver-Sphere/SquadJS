import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Logger from 'core/logger';

import SquadServer from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class SquadServerFactory {
  static async buildFromConfig(config) {
    Logger.setTimeStamps(config.logger.timestamps ? config.logger.timestamps : false);

    // setup logging levels
    for (const [module, verboseness] of Object.entries(config.logger.verboseness)) {
      Logger.setVerboseness(module, verboseness);
    }

    for (const [module, color] of Object.entries(config.logger.colors)) {
      Logger.setColor(module, color);
    }

    // create SquadServer
    Logger.verbose('SquadServerFactory', 1, 'Creating SquadServer...');
    return new SquadServer(config.server);
  }

  static parseConfig(configString) {
    try {
      return JSON.parse(configString);
    } catch (err) {
      throw new Error('Unable to parse config file.');
    }
  }

  static buildFromConfigString(configString) {
    Logger.verbose('SquadServerFactory', 1, 'Parsing config string...');
    return SquadServerFactory.buildFromConfig(SquadServerFactory.parseConfig(configString));
  }

  static buildFromConfigFile(configPath) {
    Logger.verbose('SquadServerFactory', 1, 'Reading config file...');

    // Make the config path relevant to root directory.
    configPath = path.resolve(__dirname, '../', configPath);

    // Check the config file exists.
    if (!fs.readFileSync(configPath)) {
      throw new Error('Config file does not exist.');
    }

    // Read the config file.
    const configString = fs.readFileSync(configPath, 'utf-8');

    // Build the SquadServer from the config string.
    return SquadServerFactory.buildFromConfigString(configString);
  }
}
