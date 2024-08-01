import printLogo from 'squad-server/logo';

import { ConfigSystem } from './src/config-system';
import { PluginSystem } from './src/plugin-system';

async function main() {
  // Print the SquadJS logo.
  await printLogo();

  // Get the config from the environment variables (if applicable).
  const config: string = process.env.config;

  // Get the config path from the arguments (if applicable.
  const configPath: string = process.argv[2];

  // Throw an error if a config is specified through both environmental variables and arguments.
  if (config && configPath) throw new Error('Cannot accept both a config and config path.');

  // Create a SquadServer instance.
  const server = config
    ? await ConfigSystem.buildFromConfigString(config)
    : await ConfigSystem.buildFromConfigFile(configPath || './config.json');

  // Load the installed plugins.
  await PluginSystem.loadPlugins(server);

  // Watch the server.
  await server.watch();
}

main();
