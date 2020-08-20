import { RCON_CHAT_MESSAGE } from 'squad-server/events/rcon';

export default {
  name: 'team-randomizer',
  description: 'Randomize teams with an admin command.',
  defaultDisabled: false,

  optionsSpec: {
    command: {
      type: 'String',
      required: false,
      default: '!randomize',
      description: 'The command used to randomize the teams.'
    }
  },

  init: async (server, options) => {
    const commandRegex = new RegExp(`^${options.command}`, 'i');

    server.on(RCON_CHAT_MESSAGE, (info) => {
      if (info.chat !== 'ChatAdmin') return;

      const match = info.message.match(commandRegex);
      if (!match) return;

      const players = server.players.slice(0);

      let currentIndex = players.length;
      let temporaryValue;
      let randomIndex;

      // While there remain elements to shuffle...
      while (currentIndex !== 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = players[currentIndex];
        players[currentIndex] = players[randomIndex];
        players[randomIndex] = temporaryValue;
      }

      let team = '1';

      for (const player of players) {
        if (player.teamID !== team) {
          server.rcon.execute(`AdminForceTeamChange "${player.steamID}"`);
        }

        team = team === '1' ? '2' : '1';
      }
    });
  }
};
