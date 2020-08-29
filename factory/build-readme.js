import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import plugins from 'plugins';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pluginNames = Object.keys(plugins);
const sortedPluginNames = pluginNames.sort((a, b) =>
  a.name < b.name ? -1 : a.name > b.name ? 1 : 0
);

const pluginInfo = [];
for (const pluginName of sortedPluginNames) {
  const plugin = plugins[pluginName];

  const optionTable = [];
  for (const optionName of Object.keys(plugin.optionsSpec)) {
    const option = plugin.optionsSpec[optionName];
    optionTable.push(
      `<tr><td>${optionName}</td><td>${option.type}</td><td>${option.required}</td><td>${
        typeof option.default === 'object' ? JSON.stringify(option.default) : option.default
      }</td><td>${option.description}</td></tr>`
    );
  }

  pluginInfo.push(
    `### ${plugin.name}
${plugin.description}

##### Options
<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Type</th>
      <th>Required</th>
      <th>Default</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
      ${optionTable.join('\n')}
  </tbody>
</table>`
  );
}

const pluginInfoText = pluginInfo.join('\n\n');

fs.writeFileSync(
  path.resolve(__dirname, '../README.md'),
  fs
    .readFileSync(path.resolve(__dirname, './templates/readme-template.md'), 'utf8')
    .replace(/\/\/PLUGIN-INFO\/\//, pluginInfoText)
);
