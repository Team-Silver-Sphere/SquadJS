import BasePlugin from './base-plugin.js';

export default class TeamRandomizer extends BasePlugin {
  static get description() {
    return (
      "The <code>TeamRandomizer</code> can be used to randomize teams. It's great for destroying clan stacks or for " +
      'social events. It can be run by typing, by default, <code>!randomize</code> into in-game admin chat'
    );
  }

  static get defaultEnabled() {
    return true;
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

  async init() {
    this.server.on(`CHAT_COMMAND:${this.options.command}`, this.handleOnCHatCommand.bind(this));
  }

  destroy() {
    this.server.removeListener(`CHAT_COMMAND:${this.options.command}`, this.handleOnCHatCommand);
  }

  async handleOnCHatCommand(info) {
    if (info.chat !== 'ChatAdmin') return;

    const players = this.server.players.slice(0);

    let currentIndex = players.length;
    let temporaryValue;
    let randomIndex;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = players[currentIndex];
      players[currentIndex] = players[randomIndex];
      players[randomIndex] = temporaryValue;
    }

    let team = '1';

    for (const player of players) {
      if (player.teamID !== team) await this.server.rcon.switchTeam(player.steamID);

      team = team === '1' ? '2' : '1';
    }
  }
}
