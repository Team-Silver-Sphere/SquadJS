import fs from 'fs';

export class ServerConfig {
  instance;
  config;

  constructor(configObject) {
    for (const option of ['host', 'queryPort'])
      if (!(option in configObject.server)) throw new Error(`${option} must be specified.`);

    if (!configObject.server.layerHistoryMaxLength) configObject.server.layerHistoryMaxLength = 20;
    configObject.plugins = this.checkPluginsConfig(configObject.plugins, configObject.connectors);
    this.config = configObject;

    // TODO: Verify json format with AJV for example
  }

  checkPluginsConfig(plugins) {
    if (!plugins || plugins.length <= 0) throw Error("No plugins specified in config file.")

    plugins = plugins.filter(plugin => plugin.enabled);

    return plugins;
  }

  static buildFromConfigFile(file) {
    if (!fs.existsSync(file)) throw new Error(`Config file not found: "${file}"`);
    const configString = fs.readFileSync(file, 'utf8');
    return ServerConfig.buildFromPlainString(configString);
  };

  static buildFromPlainString(configString) {
    try {
      const configObject = JSON.parse(configString);
      this.instance = new ServerConfig(configObject);
      Object.freeze(this.instance);
    } catch (e) {
      // TODO: Log Stuff and help with parse errors related to JSON format
      throw e;
    }
    return this.instance;
  };

  static getInstance() {
    if (!this.instance) throw new Error('Config instance not initialised, call buildFromConfigFile or buildFromPlainString first');
    return this.instance;
  }
}
