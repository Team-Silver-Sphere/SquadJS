import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import plugins from '../plugins/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const template = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, './templates/config-template.json'), 'utf8')
);

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

fs.writeFileSync(path.resolve(__dirname, '../../config-example.json'), JSON.stringify(template, null, 2));
