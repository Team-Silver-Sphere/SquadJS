import { LOG_PARSER_TEAMKILL } from 'squad-server/events/log-parser';

export default {
  name: 'auto-tk-warn',
  description: 'Automatically warn players who teamkill.',
  defaultDisabled: false,

  optionsSpec: {
    message: {
      type: 'String',
      required: false,
      default: 'Please apologise for ALL TKs in ALL chat!',
      description: 'The message to warn players with.'
    }
  },

  init: async (server, connectors, options) => {
    server.on(LOG_PARSER_TEAMKILL, (info) => {
      // ignore suicides
      if (info.attacker.steamID === info.victim.steamID) return;
      server.rcon.execute(`AdminWarn "${info.attacker.steamID}" ${options.message}`);
    });
  }
};
