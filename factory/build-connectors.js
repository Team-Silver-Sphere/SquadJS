import Discord from 'discord.js';
import mysql from 'mysql';
import { SquadLayerFilter } from 'core/squad-layers';

import plugins from 'plugins';

const connectorTypes = {
  discordClient: async function (config) {
    console.log('Starting discordClient connector...');
    const client = new Discord.Client();
    await client.login(config);
    return client;
  },
  mysqlPool: async function (config) {
    console.log('Starting mysqlPool connector...');
    return mysql.createPool(config);
  },
  layerFilter: async function (config) {
    console.log('Starting layerFilter connector...');
    return SquadLayerFilter[config.type](config.filter, config.activeLayerFilter);
  }
};

export default async function (config) {
  const connectors = {};

  for (const pluginConfig of config.plugins) {
    if (!pluginConfig.enabled) continue;

    const plugin = plugins[pluginConfig.plugin];

    for (const optionName of Object.keys(plugin.optionsSpec)) {
      // check it's a connector
      if (!Object.keys(connectorTypes).includes(optionName)) continue;

      // check if connector is already setup
      if (connectors[pluginConfig[optionName]]) continue;

      // check config for connector is present
      if (!config.connectors[pluginConfig[optionName]])
        throw new Error(`${pluginConfig[optionName]} connector config not present!`);

      // initiate connector
      connectors[pluginConfig[optionName]] = await connectorTypes[optionName](
        config.connectors[pluginConfig[optionName]]
      );
    }
  }

  return connectors;
}
