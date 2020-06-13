import { LOG_PARSER_TEAMKILL } from 'squad-server/events/log-parser';

export default async function(server, options = {}) {
  if (!server)
    throw new Error('DiscordAdminCamLogs must be provided with a reference to the server.');

  server.on(LOG_PARSER_TEAMKILL, info => {
    // ignore suicides
    if (info.attacker.steamID === info.victim.steamID) return;
    server.rcon.execute(
      `AdminWarn "${info.attacker.steamID}" ${options.message ||
        'Please apologise for ALL TKs in ALL chat!'}`
    );
  });
}
