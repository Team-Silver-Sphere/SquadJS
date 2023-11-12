import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Discord from 'discord.js';
import sequelize from 'sequelize';
import AwnAPI from './utils/awn-api.js';
import ConfigTools from './utils/config-tools.js';

import Logger from 'core/logger';

import SquadServer from './index.js';
import Plugins from './plugins/index.js';

const { Sequelize } = sequelize;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class SquadServerFactory {
  static async buildFromConfig(config) {
    Logger.verbose('SquadServerFactory', 4, `Logging config:\n${JSON.stringify(config)}`);
    Logger.setTimeStamps(config.logger.timestamps ? config.logger.timestamps : false);

    const plugins = await Plugins.getPlugins();

    for (const plugin of Object.keys(plugins)) {
      Logger.setColor(plugin, 'magentaBright');
    }

    // setup logging levels
    for (const [module, verboseness] of Object.entries(config.logger.verboseness)) {
      Logger.setVerboseness(module, verboseness);
    }

    for (const [module, color] of Object.entries(config.logger.colors)) {
      Logger.setColor(module, color);
    }

    // create SquadServer
    Logger.verbose('SquadServerFactory', 1, 'Creating SquadServer...');
    const server = new SquadServer(config.server);

    // initialise connectors
    Logger.verbose('SquadServerFactory', 1, 'Preparing connectors...');
    const connectors = {};
    for (const pluginConfig of config.plugins) {
      if (!pluginConfig.enabled) continue;

      if (!plugins[pluginConfig.plugin])
        throw new Error(`Plugin ${pluginConfig.plugin} does not exist.`);

      const Plugin = plugins[pluginConfig.plugin];

      for (const [optionName, option] of Object.entries(Plugin.optionsSpecification)) {
        // ignore non connectors
        if (!option.connector) continue;

        // check the connector is listed in the options
        if (!(optionName in pluginConfig))
          throw new Error(
            `${Plugin.name}: ${optionName} (${option.connector} connector) is missing.`
          );

        // get the name of the connector
        const connectorName = pluginConfig[optionName];

        // skip already created connectors
        if (connectors[connectorName]) continue;

        // create the connector
        connectors[connectorName] = await SquadServerFactory.createConnector(
          server,
          option.connector,
          connectorName,
          config.connectors[connectorName]
        );
      }
    }

    // initialise plugins
    Logger.verbose('SquadServerFactory', 1, 'Initialising plugins...');

    for (const pluginConfig of config.plugins) {
      if (!pluginConfig.enabled) continue;

      if (!plugins[pluginConfig.plugin])
        throw new Error(`Plugin ${pluginConfig.plugin} does not exist.`);

      const Plugin = plugins[pluginConfig.plugin];

      Logger.verbose('SquadServerFactory', 1, `Initialising ${Plugin.name}...`);

      const plugin = new Plugin(server, pluginConfig, connectors);

      // allow the plugin to do any asynchronous work needed before it can be mounted
      await plugin.prepareToMount();

      server.plugins.push(plugin);
    }

    return server;
  }

  static async createConnector(server, type, connectorName, connectorConfig) {
    Logger.verbose('SquadServerFactory', 1, `Starting ${type} connector ${connectorName}...`);

    if (type === 'discord') {
      const connector = new Discord.Client();
      await connector.login(connectorConfig);
      return connector;
    }

    if (type === 'sequelize') {
      let connector;

      if (typeof connectorConfig === 'string') {
        connector = new Sequelize(connectorConfig, {
          define: {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci'
          },
          logging: (msg) => Logger.verbose('Sequelize', 3, msg)
        });
      } else if (typeof connectorConfig === 'object') {
        connector = new Sequelize({
          ...connectorConfig,
          logging: (msg) => Logger.verbose('Sequelize', 3, msg)
        });
      } else {
        throw new Error('Unknown sequelize connector config type.');
      }

      await connector.authenticate();
      return connector;
    }

    if (type === 'awnAPI') {
      const awn = new AwnAPI(connectorConfig);
      await awn.auth(connectorConfig);
      return awn;
    }

    throw new Error(`${type.connector} is an unsupported connector type.`);
  }

  static parseConfig(configString) {
    try {
      return JSON.parse(configString);
    } catch (err) {
      throw new Error(`Unable to parse config file. ${err}`);
    }
  }

  static buildFromConfigString(configString) {
    Logger.verbose('SquadServerFactory', 1, 'Parsing config string...');
    return SquadServerFactory.buildFromConfig(SquadServerFactory.parseConfig(configString));
  }

  static readConfigFile(configPath = './config.json') {
    configPath = path.resolve(__dirname, '../', configPath);
    if (!fs.existsSync(configPath)) throw new Error(`Config file does not exist. ${configPath}`);

    Logger.verbose('SquadServerFactory', 1, `Reading config file ${configPath}`);
    return fs.readFileSync(configPath, 'utf8');
  }

  static buildFromConfigFiles(configPaths) {
    Logger.verbose('SquadServerFactory', 1, 'Reading config files...');
    Logger.verbose('SquadServerFactory', 4, JSON.stringify(configPaths));

    const configs = configPaths.map((configPath) =>
      SquadServerFactory.parseConfig(SquadServerFactory.readConfigFile(configPath))
    );

    return SquadServerFactory.buildFromConfig(ConfigTools.mergeConfigs({}, ...configs));
  }

  static async buildConfig() {
    const plugins = await Plugins.getPlugins();

    const templatePath = path.resolve(__dirname, './templates/config-template.json');
    const templateString = fs.readFileSync(templatePath, 'utf8');
    const template = SquadServerFactory.parseConfig(templateString);

    const pluginKeys = Object.keys(plugins).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    );

    for (const pluginKey of pluginKeys) {
      const Plugin = plugins[pluginKey];

      const pluginConfig = { plugin: Plugin.name, enabled: Plugin.defaultEnabled };
      for (const [optionName, option] of Object.entries(Plugin.optionsSpecification)) {
        pluginConfig[optionName] = option.default;
      }

      template.plugins.push(pluginConfig);
    }

    return template;
  }

  static async buildConfigFile() {
    const configPath = path.resolve(__dirname, '../config.example.json');
    const config = await SquadServerFactory.buildConfig();

    const configString = JSON.stringify(config, null, 2);
    fs.writeFileSync(configPath, configString);
  }

  static async buildReadmeFile() {
    const plugins = await Plugins.getPlugins();

    const pluginKeys = Object.keys(plugins).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    );

    const pluginInfo = [];

    for (const pluginName of pluginKeys) {
      const Plugin = plugins[pluginName];

      const options = [];
      for (const [optionName, option] of Object.entries(Plugin.optionsSpecification)) {
        let optionInfo = `<li><h4>${optionName}${option.required ? ' (Required)' : ''}</h4>
           <h6>Description</h6>
           <p>${option.description}</p>
           <h6>Default</h6>
           <pre><code>${
             typeof option.default === 'object'
               ? JSON.stringify(option.default, null, 2)
               : option.default
           }</code></pre></li>`;

        if (option.example)
          optionInfo += `<h6>Example</h6>
           <pre><code>${
             typeof option.example === 'object'
               ? JSON.stringify(option.example, null, 2)
               : option.example
           }</code></pre>`;

        options.push(optionInfo);
      }

      pluginInfo.push(
        `<details>
          <summary>${Plugin.name}</summary>
          <h2>${Plugin.name}</h2>
          <p>${Plugin.description}</p>
          <h3>Options</h3>
          <ul>${options.join('\n')}</ul>
        </details>`
      );
    }

    const pluginInfoText = pluginInfo.join('\n\n');

    const templatePath = path.resolve(__dirname, './templates/readme-template.md');
    const template = fs.readFileSync(templatePath, 'utf8');

    const readmePath = path.resolve(__dirname, '../README.md');
    const readme = template.replace(/\/\/PLUGIN-INFO\/\//, pluginInfoText);

    fs.writeFileSync(readmePath, readme);
  }
}
