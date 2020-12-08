import AutoKickUnassigned from './auto-kick-unassigned.js';
import AutoTKWarn from './auto-tk-warn.js';
import ChatCommands from './chat-commands.js';
import DBLog from './db-log.js';
import DiscordAdminBroadcast from './discord-admin-broadcast.js';
import DiscordAdminCamLogs from './discord-admin-cam-logs.js';
import DiscordAdminRequest from './discord-admin-request.js';
import DiscordChat from './discord-chat.js';
import DiscordDebug from './discord-debug.js';
import DiscordRcon from './discord-rcon.js';
import DiscordRoundWinner from './discord-round-winner.js';
import DiscordServerStatus from './discord-server-status.js';
import DiscordSubsystemRestarter from './discord-subsystem-restarter.js';
import IntervalledBroadcasts from './intervalled-broadcasts.js';
import SeedingMode from './seeding-mode.js';
import TeamRandomizer from './team-randomizer.js';

const plugins = [
  AutoKickUnassigned,
  AutoTKWarn,
  ChatCommands,
  DBLog,
  DiscordAdminBroadcast,
  DiscordAdminCamLogs,
  DiscordAdminRequest,
  DiscordChat,
  DiscordDebug,
  DiscordRcon,
  DiscordRoundWinner,
  DiscordServerStatus,
  DiscordSubsystemRestarter,
  IntervalledBroadcasts,
  SeedingMode,
  TeamRandomizer
];

const pluginsByName = {};
for (const plugin of plugins) {
  pluginsByName[plugin.name] = plugin;
}

export default pluginsByName;
