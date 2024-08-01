import Logger from 'core/logger';
import fs from 'fs';

import SquadServer from '../../squad-server';
import { Config } from '../types';

export class ConfigSystem {
  static async buildFromConfig(config: Config): Promise<SquadServer> {
    Logger.verbose('SquadServerFactory', 1, 'Creating SquadServer...');

    // Set the logger options.
    Logger.setConfig(config.logger);

    // Create the SquadServer.
    return new SquadServer(config.server);
  }

  static buildFromConfigString(configString: string): Promise<SquadServer> {
    Logger.verbose('SquadServerFactory', 1, 'Parsing config string...');

    // Parse the config string.
    let config: Config;
    try {
      config = JSON.parse(configString);
    } catch (err) {
      throw new Error('Unable to parse config file.');
    }

    // Create the SquadServer.
    return ConfigSystem.buildFromConfig(config);
  }

  static buildFromConfigFile(configPath: string): Promise<SquadServer> {
    Logger.verbose('SquadServerFactory', 1, 'Reading config file...');

    // Check the config file exists.
    if (!fs.readFileSync(configPath)) {
      throw new Error('Config file does not exist.');
    }

    // Read the config file.
    const configString: string = fs.readFileSync(configPath, 'utf-8');

    // Create the SquadServer.
    return ConfigSystem.buildFromConfigString(configString);
  }
}