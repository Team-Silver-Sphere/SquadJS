import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import plugins from '../plugins/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const configTemplate = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, './templates/config-template.json'), 'utf8')
);

const pluginKeys = Object.keys(plugins).sort((a, b) =>
  a.name < b.name ? -1 : a.name > b.name ? 1 : 0
);

for (const pluginKey of pluginKeys) {
  const plugin = plugins[pluginKey];

  const pluginConfig = { plugin: plugin.name, enabled: plugin.defaultEnabled };
  for (const option in plugin.optionsSpec) {
    pluginConfig[option] = plugin.optionsSpec[option].default;
  }
  configTemplate.plugins.push(pluginConfig);
}

const configPath = './config.json';
const fullConfigPath = path.resolve(__dirname, '../', configPath);

if (!fs.existsSync(fullConfigPath)) {
  fs.writeFileSync(fullConfigPath, JSON.stringify(configTemplate, null, 2));
  throw new Error(
    `SquadJS couldn't find any configuration file. We have generated a config file at ${fullConfigPath}. This file needs to be configured before running SquadJS again.`
  );
}

const unparsedConfig = fs.readFileSync(fullConfigPath, 'utf8');
let parsedConfig;
try {
  parsedConfig = JSON.parse(unparsedConfig);
} catch (err) {
  throw new Error(`Unable to parse config file. ${err}`);
}

const parsedExampleConfig = configTemplate;

// merges two lists of objects based on the value of a given common property
// items from the second list will override matching items in the first
function merge(a, b, prop) {
  var merged = a.filter((aitem) => !b.find((bitem) => aitem[prop] === bitem[prop]));
  merged = merged.concat(b);
  merged.sort((a, b) => (a[prop] < b[prop] ? -1 : a[prop] > b[prop] ? 1 : 0));
  return merged;
}

// merge example plugins and user plugins, in case any new plugins have been added and are not in the users conifg
parsedConfig.plugins = merge({}, parsedExampleConfig.plugins, parsedConfig.plugins, 'plugin');

// merges configs, this will add any missing properties for plugins or new sections
parsedConfig = Object.assign({}, parsedExampleConfig, parsedConfig);

if (parsedConfig.squadjs.autoUpdateMyConfig) {
  fs.writeFileSync(fullConfigPath, JSON.stringify(parsedConfig, null, 2));
}
