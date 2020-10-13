import AutoTKWarn from './auto-tk-warn.js';
import ChatCommands from './chat-commands.js';
import DiscordAdminBroadcast from './discord-admin-broadcast.js';
import DiscordAdminRequest from './discord-admin-request.js';
import DiscordRcon from './discord-rcon.js';
import IntervalledBroadcasts from './intervalled-broadcasts.js';
import SeedingMode from './seeding-mode.js';

const plugins = [
  AutoTKWarn,
  ChatCommands,
  DiscordAdminBroadcast,
  DiscordAdminRequest,
  DiscordRcon,
  IntervalledBroadcasts,
  SeedingMode
];

const pluginsByName = {};
for (const plugin of plugins) {
  pluginsByName[plugin.name] = plugin;
}

export default pluginsByName;
