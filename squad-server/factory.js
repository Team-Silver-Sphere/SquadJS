import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Discord from 'discord.js';
import mysql from 'mysql';

import Logger from 'core/logger';

import SquadServer from './index.js';
import plugins from './plugins/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class SquadServerFactory {
  static async buildFromConfig(config) {
    // Setup logging levels
    for (const [module, verboseness] of Object.entries(config.verboseness)) {
      Logger.setVerboseness(module, verboseness);
    }

    Logger.verbose('SquadServerFactory', 1, 'Creating SquadServer...');
    const server = new SquadServer(config.server);

    // pull layers read to use to create layer filter connectors
    await server.squadLayers.pull();

    Logger.verbose('SquadServerFactory', 1, 'Preparing connectors...');
    const connectors = {};
    for (const pluginConfig of config.plugins) {
      if (!pluginConfig.enabled) continue;

      const Plugin = plugins[pluginConfig.plugin];

      for (const [optionName, option] of Object.entries(Plugin.optionsSpecification)) {
        // ignore non connectors
        if (!option.connector) continue;

        if (!(optionName in pluginConfig))
          throw new Error(
            `${Plugin.name}: ${optionName} (${option.connector} connector) is missing.`
          );

        const connectorName = pluginConfig[optionName];

        // skip already created connectors
        if (connectors[connectorName]) continue;

        const connectorConfig = config.connectors[connectorName];

        if (option.connector === 'discord') {
          Logger.verbose('SquadServerFactory', 1, `Starting discord connector ${connectorName}...`);
          connectors[connectorName] = new Discord.Client();
          await connectors[connectorName].login(connectorConfig);
        } else if (option.connector === 'mysql') {
          Logger.verbose(
            'SquadServerFactory',
            1,
            `Starting mysqlPool connector ${connectorName}...`
          );
          connectors[connectorName] = mysql.createPool(connectorConfig);
        } else if (option.connector === 'squadlayerpool') {
          Logger.verbose(
            'SquadServer',
            1,
            `Starting squadlayerfilter connector ${connectorName}...`
          );
          connectors[connectorName] = server.squadLayers[connectorConfig.type](
            connectorConfig.filter,
            connectorConfig.activeLayerFilter
          );
        } else {
          throw new Error(`${option.connector} is an unsupported connector type.`);
        }
      }
    }

    Logger.verbose('SquadServerFactory', 1, 'Applying plugins to SquadServer...');
    for (const pluginConfig of config.plugins) {
      if (!pluginConfig.enabled) continue;

      if (!plugins[pluginConfig.plugin])
        throw new Error(`Plugin ${pluginConfig.plugin} does not exist.`);

      const Plugin = plugins[pluginConfig.plugin];

      Logger.verbose('SquadServerFactory', 1, `Initialising ${Plugin.name}...`);

      const options = {};
      for (const [optionName, option] of Object.entries(Plugin.optionsSpecification)) {
        if (option.connector) {
          options[optionName] = connectors[pluginConfig[optionName]];
        } else {
          if (option.required) {
            if (!(optionName in pluginConfig))
              throw new Error(`${Plugin.name}: ${optionName} is required but missing.`);
            if (option.default === pluginConfig[optionName])
              throw new Error(
                `${Plugin.name}: ${optionName} is required but is the default value.`
              );
          }

          options[optionName] = pluginConfig[optionName] || option.default;
        }
      }

      server.plugins.push(new Plugin(server, options, pluginConfig));
    }

    Logger.verbose('SquadServerFactory', 1, 'SquadServer built.');

    return server;
  }

  static parseConfig(configString) {
    try {
      return JSON.parse(configString);
    } catch (err) {
      throw new Error('Unable to parse config file.');
    }
  }

  static buildFromConfigString(configString) {
    Logger.verbose('SquadServerFactory', 1, 'Parsing config string...');
    return SquadServerFactory.buildFromConfig(SquadServerFactory.parseConfig(configString));
  }

  static readConfigFile(configPath = './config.json') {
    configPath = path.resolve(__dirname, '../', configPath);
    if (!fs.existsSync(configPath)) throw new Error('Config file does not exist.');
    return fs.readFileSync(configPath, 'utf8');
  }

  static buildFromConfigFile(configPath) {
    Logger.verbose('SquadServerFactory', 1, 'Reading config file...');
    return SquadServerFactory.buildFromConfigString(SquadServerFactory.readConfigFile(configPath));
  }

  static buildConfig() {
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

  static buildConfigFile() {
    const configPath = path.resolve(__dirname, '../config.json');
    const config = JSON.stringify(SquadServerFactory.buildConfig(), null, 2);
    fs.writeFileSync(configPath, config);
  }

  static buildReadmeFile() {
    const pluginKeys = Object.keys(plugins).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    );

    const pluginInfo = [];

    for (const pluginName of pluginKeys) {
      const Plugin = plugins[pluginName];

      const options = [];
      for (const [optionName, option] of Object.entries(Plugin.optionsSpecification)) {
        let optionInfo = `<h4>${optionName}${option.required ? ' (Required)' : ''}</h4>
           <h6>Description</h6>
           <p>${option.description}</p>
           <h6>Default</h6>
           <pre><code>${
             typeof option.default === 'object'
               ? JSON.stringify(option.default, null, 2)
               : option.default
           }</code></pre>`;

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
          ${options.join('\n')}
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
