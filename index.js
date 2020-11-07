import SquadServerFactory from 'squad-server/factory';
import printLogo from 'squad-server/logo';

async function main() {
  await printLogo();

  const config = process.env.config;
  const configPath = process.argv[2];
  if (config && configPath) throw new Error('Cannot accept both a config and config path.');

  const server = config
    ? await SquadServerFactory.buildFromConfigString(config)
    : await SquadServerFactory.buildFromConfigFile(configPath || './config.json');

  await server.watch();
}

main();
