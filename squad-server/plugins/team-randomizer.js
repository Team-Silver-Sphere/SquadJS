import BasePlugin from './base-plugin.js';

export default class TeamRandomizer extends BasePlugin {
  static get description() {
    return (
      "The <code>TeamRandomizer</code> can be used to randomize teams. It's great for destroying clan stacks or for " +
      'social events. It can be run by typing, by default, <code>!randomize</code> into in-game admin chat'
    );
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      command: {
        required: false,
        description: 'The command used to randomize the teams.',
        default: 'randomize'
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onChatCommand = this.onChatCommand.bind(this);
  }

  async mount() {
    this.server.on(`CHAT_COMMAND:${this.options.command}`, this.onChatCommand);
  }

  async unmount() {
    this.server.removeEventListener(`CHAT_COMMAND:${this.options.command}`, this.onChatCommand);
  }

  async onChatCommand(info) {
    if (info.chat !== 'ChatAdmin') return;
    if (this.randomizing) {
      await this.server.rcon.warn(info.player.eosID, 'Randomization already in progress.');
      return;
    }
    this.randomizing = true;

    try {
      const players = this.server.players.slice(0);

      let currentIndex = players.length;

      while (currentIndex !== 0) {
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        [players[currentIndex], players[randomIndex]] = [
          players[randomIndex],
          players[currentIndex]
        ];
      }

      await this.server.rcon.broadcast('Teams are being randomized, please wait.');

      let team = '1';
      let switched = 0;

      for (const player of players) {
        if (player.teamID !== team) {
          try {
            await this.server.rcon.switchTeam(player.eosID);
            switched++;
          } catch (error) {
            this.verbose(1, `Failed to switch ${player.name}: ${error.message}`);
          }
        }
        team = team === '1' ? '2' : '1';
      }

      await this.server.rcon.warn(
        info.player.eosID,
        `Randomization complete. ${switched} player(s) switched.`
      );
    } finally {
      this.randomizing = false;
    }
  }
}
