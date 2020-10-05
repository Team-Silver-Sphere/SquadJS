import ExamplePlugin from './example-plugin.js';

const plugins = [ExamplePlugin];

const pluginsByName = {};
for (const plugin of plugins) {
  pluginsByName[plugin.name] = plugin;
}

export default pluginsByName;
