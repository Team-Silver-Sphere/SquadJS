import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import plugins from '../plugins/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pluginNames = Object.keys(plugins);
const sortedPluginNames = pluginNames.sort((a, b) =>
  a.name < b.name ? -1 : a.name > b.name ? 1 : 0
);

const pluginInfo = [];
for (const pluginName of sortedPluginNames) {
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

fs.writeFileSync(
  path.resolve(__dirname, '../../README.md'),
  fs
    .readFileSync(path.resolve(__dirname, './templates/readme-template.md'), 'utf8')
    .replace(/\/\/PLUGIN-INFO\/\//, pluginInfoText)
);
