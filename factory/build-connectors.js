import Discord from 'discord.js';
import mysql from 'mysql';
import { SquadLayerFilter } from 'core/squad-layers';

import plugins from 'plugins';

const connectorTypes = {
  DiscordConnector: async function (config) {
    const client = new Discord.Client();
    await client.login(config);
    return client;
  },
  MySQLPoolConnector: async function (config) {
    return mysql.createPool(config);
  },
  SquadLayerFilterConnector: async function (config) {
    return SquadLayerFilter[config.type](config.filter, config.activeLayerFilter);
  }
};

export default async function (config) {
  const connectors = {};

  for (const pluginConfig of config.plugins) {
    if (pluginConfig.disabled) continue;

    const plugin = plugins[pluginConfig.plugin];

    for (const optionName of Object.keys(plugin.optionsSpec)) {
      const option = plugin.optionsSpec[optionName];

      if (!Object.keys(connectorTypes).includes(option.type)) continue;
      if (!connectorTypes[option.type]) throw new Error('Connector type not supported!');

      if (connectors[pluginConfig[optionName]]) continue;
      if (!config.connectors[pluginConfig[optionName]])
        throw new Error(`${pluginConfig[optionName]} connector config not present!`);

      connectors[pluginConfig[optionName]] = await connectorTypes[option.type](
        config.connectors[pluginConfig[optionName]]
      );
    }
  }

  return connectors;
}
