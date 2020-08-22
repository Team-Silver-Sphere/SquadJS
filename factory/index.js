import readConfig from './read-config.js';
import buildSquadServer from './build-squad-server.js';
import buildConnectors from './build-connectors.js';

import plugins from 'plugins';

export default async function (configPath) {
  console.log('SquadJS factory commencing building...');

  console.log('Getting config file...');
  const config = readConfig(configPath);

  console.log('Building Squad server...');
  const server = buildSquadServer(config);

  console.log('Initialising connectors...');
  const connectors = await buildConnectors(config);

  console.log('Loading plugins...');
  for (const pluginConfig of config.plugins) {
    if (!pluginConfig.enabled) continue;

    console.log(`Loading plugin ${pluginConfig.plugin}...`);
    const plugin = plugins[pluginConfig.plugin];

    const options = {};
    for (const optionName of Object.keys(plugin.optionsSpec)) {
      const option = plugin.optionsSpec[optionName];

      if (option.type.match(/Connector$/)) {
        options[optionName] = connectors[pluginConfig[optionName]];
      } else {
        if (option.required) {
          if (!(optionName in pluginConfig))
            throw new Error(`${plugin.name}: ${optionName} is required but missing.`);
          if (option.default === pluginConfig[optionName])
            throw new Error(`${plugin.name}: ${optionName} is required but is the default value.`);
        }

        options[optionName] = pluginConfig[optionName] || option.default;
      }
    }

    await plugin.init(server, options);
  }

  return server;
}
