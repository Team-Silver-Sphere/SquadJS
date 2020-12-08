import SquadServerFactory from 'squad-server/factory';
import printLogo from 'squad-server/logo';

async function main() {
  await printLogo();

  const config = process.env.config;
  const configPath = process.argv[2];
  if (config && configPath) throw new Error('Cannot accept both a config and config path.');

  // create a SquadServer instance
  const server = config
    ? await SquadServerFactory.buildFromConfigString(config)
    : await SquadServerFactory.buildFromConfigFile(configPath || './config.json');

  // watch the server
  await server.watch();

  // now mount the plugins
  await Promise.all(server.plugins.map(async (plugin) => await plugin.mount()));
}

main();
