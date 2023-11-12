import SquadServerFactory from 'squad-server/factory';
import printLogo from 'squad-server/logo';

async function main() {
  await printLogo();

  const config = process.env.config;
  const args = process.argv.slice(2);
  const configPaths = args.length ? args : ['./config.json'];

  if (config && args.length) throw new Error('Cannot accept both a config and config paths.');

  // create a SquadServer instance
  const server = config
    ? await SquadServerFactory.buildFromConfigString(config)
    : await SquadServerFactory.buildFromConfigFiles(configPaths);

  // watch the server
  await server.watch();

  // now mount the plugins
  await Promise.all(server.plugins.map(async (plugin) => await plugin.mount()));
}

main();
