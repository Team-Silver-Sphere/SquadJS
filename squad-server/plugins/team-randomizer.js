import BasePlugin from './base-plugin.js';
import { setTimeout as delay } from 'timers/promises';

export default class TeamRandomizer extends BasePlugin {
  static get description() {
    return "Queues a team shuffle for the end of the match. Run by typing !randomize in admin chat.";
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      command: {
        required: false,
        description: 'The command used to queue the randomization.',
        default: 'randomize'
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.queued = false;
    this.onChatCommand = this.onChatCommand.bind(this);
    this.onRoundEnded = this.onRoundEnded.bind(this);
  }

  async mount() {
    this.server.on(`CHAT_COMMAND:${this.options.command}`, this.onChatCommand);
    this.server.on('ROUND_ENDED', this.onRoundEnded);
  }

  async unmount() {
    this.server.removeListener(`CHAT_COMMAND:${this.options.command}`, this.onChatCommand);
    this.server.removeListener('ROUND_ENDED', this.onRoundEnded);
  }

  async onChatCommand(info) {
    if (info.chat !== 'ChatAdmin') return;

    this.queued = true;

    // Private confirmation to the admin
    await this.server.rcon.warn(info.player.eosID, "Randomize queued. It will execute 20 seconds after the match ends.");

    // Server-wide early warning mid-game
    await this.server.rcon.broadcast("[Admin] Teams will be randomized at the end of this match for gameplay quality.");
  }

  async onRoundEnded() {
    // If command wasn't typed this round, do nothing
    if (!this.queued) return;

    // Action warning at the exact moment the match ends
    await this.server.rcon.broadcast("[Auto Balance] Teams are being balanced for gameplay quality. Shuffling in 20 seconds...");

    // Wait exactly 20 seconds to push into the scoreboard screen
  await delay(20000);

    const players = this.server.players.slice(0);

    let currentIndex = players.length;
    let temporaryValue;
    let randomIndex;

    // Shuffle the player array
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = players[currentIndex];
      players[currentIndex] = players[randomIndex];
      players[randomIndex] = temporaryValue;
    }

    let team = '1';

    // Move players to alternating teams
    for (const player of players) {
      if (player.teamID !== team) {
        await this.server.rcon.switchTeam(player.eosID);
      }
      team = team === '1' ? '2' : '1';
    }

    // Reset queue for the next match
    this.queued = false;

    // Final confirmation once moves are done
    await this.server.rcon.broadcast("[Auto Balance] Teams have been successfully randomized for the next match!");
  }
}
