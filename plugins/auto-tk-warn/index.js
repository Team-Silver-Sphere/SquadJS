import { TEAMKILL } from 'squad-server/events';

export default {
  name: 'auto-tk-warn',
  description:
    'The <code>auto-tk-warn</code> plugin will automatically warn players in game to apologise for teamkills when ' +
    'they teamkill another player.',

  defaultEnabled: true,
  optionsSpec: {
    message: {
      required: false,
      description: 'The message to warn players with.',
      default: 'Please apologise for ALL TKs in ALL chat!',
      example: 'Test'
    }
  },

  init: async (server, options) => {
    server.on(TEAMKILL, (info) => {
      // ignore suicides
      if (info.attacker.steamID === info.victim.steamID) return;
      server.rcon.warn(info.attacker.steamID, options.message);
    });
  }
};
