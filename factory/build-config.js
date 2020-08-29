import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import plugins from 'plugins';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const template = JSON.parse(
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

  template.plugins.push(pluginConfig);
}

fs.writeFileSync(path.resolve(__dirname, '../config.json'), JSON.stringify(template, null, 2));
