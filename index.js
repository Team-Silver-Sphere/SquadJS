import Logger from 'core/logger';
import SquadServer from 'squad-server';
import printLogo from 'squad-server/logo';
import { ServerConfig } from './serverconfig.js';

async function main() {
  await printLogo();

  const envConfig = process.env.config;
  const configPath = process.argv[2];
  if (envConfig && configPath) throw new Error('Cannot accept both a config and config path.');

  if (envConfig)
    ServerConfig.buildFromPlainString(envConfig);
  else
    ServerConfig.buildFromConfigFile(configPath || './config.json');

  try {
    const server = new SquadServer();

    await server.watch();
  } catch (e) {
    // Catch all uncatch errors, try not to rely on this.
    Logger.error('Main', e, e.stack);
  }
}

main();
