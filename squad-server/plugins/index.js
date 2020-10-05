import ChatCommands from './chat-commands.js';
import IntervalledBroadcasts from './intervalled-broadcasts.js';
import SeedingMode from './seeding-mode.js';

const plugins = [ChatCommands, IntervalledBroadcasts, SeedingMode];

const pluginsByName = {};
for (const plugin of plugins) {
  pluginsByName[plugin.name] = plugin;
}

export default pluginsByName;
