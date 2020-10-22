import SquadServer from 'squad-server';
import printLogo from 'squad-server/logo';

async function main() {
  await printLogo();

  const config = process.env.config;
  const configPath = process.argv[2];
  if (config && configPath) throw new Error('Cannot accept both a config and config path.');

  const server = config
    ? await SquadServer.buildFromConfigString(config)
    : await SquadServer.buildFromConfigFile(configPath || './config.json');

  await server.watch();
}

main();
