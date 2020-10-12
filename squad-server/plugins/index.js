import AutoTKWarn from './auto-tk-warn.js';
import ChatCommands from './chat-commands.js';
import DiscordRcon from './discord-rcon.js';
import IntervalledBroadcasts from './intervalled-broadcasts.js';
import SeedingMode from './seeding-mode.js';

const plugins = [AutoTKWarn, ChatCommands, DiscordRcon, IntervalledBroadcasts, SeedingMode];

const pluginsByName = {};
for (const plugin of plugins) {
  pluginsByName[plugin.name] = plugin;
}

export default pluginsByName;
