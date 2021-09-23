import DiscordBasePlugin from './discord-base-plugin.js';

export default class SwitchPlayer extends DiscordBasePlugin {
  static get description() {
    return (
      'The <code>SwitchPlayer</code> can be used by a player to switch from one team to another. ' +
      'This plugin will enforce the OWI rule of team balance not exceeding 2 to 3 players difference per team.' +
      'It can be run by typing, by default, <code>!switch</code> into in-game chat. Ex: !switchme'
    );
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelID: {
        required: true,
        description: 'The ID of the channel to log squad switches to.',
        default: '',
        example: '667741905228136459'
      },
      ignoreChats: {
        required: false,
        description: 'A list of chat names to ignore.',
        default: [],
        example: ['ChatSquad']
      },
      color: {
        required: false,
        description: 'The color of the embed.',
        default: 16761867
      },
      switchDelay: {
        required: false,
        description: 'Cooldown for switch in milliseconds. Default 1 min',
        default: 60 * 1000
      },
      teamBalance: {
        required: false,
        description: 'Maximum diference in team balance before stopping switches',
        default: 3
      },
      warnInGameAdmins: {
        required: false,
        description: 'Should in-game admins be warned after a players uses the command?',
        default: false
      },
      showInDiscord: {
        required: false,
        description: 'Should the switch be messaged in discord?',
        default: false
      },
      command: {
        required: false,
        description: 'The command used to switch to the other team.',
        default: 'switch'
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.lastSwitch = Date.now() - this.options.switchDelay;

    this.onChatCommand = this.onChatCommand.bind(this);
  }

  async mount() {
    this.server.on(`CHAT_COMMAND:${this.options.command}`, this.onChatCommand);
  }

  async unmount() {
    this.server.removeEventListener(`CHAT_COMMAND:${this.options.command}`, this.onChatCommand);
  }

  async onChatCommand(info) {
    if (this.options.ignoreChats.includes(info.chat)) return;

    if (Date.now() - this.lastSwitch < this.options.switchDelay) {
      const msLeft = this.lastSwitch - (Date.now() - this.options.switchDelay);
      const timeLeft = this.msFormat(msLeft);

      await this.server.rcon.warn(
        info.player.steamID,
        `Someone else just switched. Please wait ${timeLeft} for balance to restore and try again.`
      );
      return;
    }

    this.lastSwitch = Date.now();

    const currentTeam = info.player.teamID;
    const otherTeam = currentTeam === '1' ? '2' : '1';

    const teamCounts = {};
    teamCounts['1'] = 0;
    teamCounts['2'] = 0;

    let allowSwitch = false;

    const players = this.server.players.slice(0);

    for (let i = 0; i < players.length; i++) {
      // get team counts
      players[i].teamID === '1' ? teamCounts['1']++ : teamCounts['2']++;
    }

    // subtract player count from their team
    teamCounts[currentTeam]--;
    // add their count to the other team
    teamCounts[otherTeam]++;
    // test balance
    // always let a player move from a higher count team to a lower count team
    if (teamCounts[currentTeam] > teamCounts[otherTeam]) {
      allowSwitch = true;
    }
    // check the difference between the teams, if < defined, allow move
    else if (Math.abs(teamCounts[currentTeam] - teamCounts[otherTeam]) < this.options.teamBalance) {
      allowSwitch = true;
    }

    // as a last check, if this would put the currentTeam at 0, don't allow it
    // what fun would that be?
    if (teamCounts[currentTeam] === 0) {
      allowSwitch = false;
    }

    if (allowSwitch) {
      await this.server.rcon.switchTeam(info.player.steamID);

      const admins = await this.server.getAdminsWithPermission('canseeadminchat');
      for (const player of this.server.players) {
        if (!admins.includes(player.steamID)) continue;
        if (this.options.warnInGameAdmins)
          await this.server.rcon.warn(player.steamID, `[${info.player.name}] - Switched Teams`);
      }
    } else {
      await this.server.rcon.warn(
        info.player.steamID,
        `Teams will become unbalanced if switched right now. Please try again later.`
      );
      return;
    }

    if (this.options.showInDiscord) {
      // send a discord message
      const discordMessage = {
        embed: {
          title: `${info.player.name} has switched to the other team.`,
          color: this.options.color,
          fields: [
            {
              name: 'Team 1 count',
              value: `${teamCounts['1']}`
            },
            {
              name: 'Team 2 count',
              value: `${teamCounts['2']}`
            },
            {
              name: 'Player Switched',
              value: `${info.player.steamID}`
            }
          ],
          timestamp: info.time.toISOString()
        }
      };

      await this.sendDiscordMessage(discordMessage);
    }
  }

  msFormat(ms) {
    // take in generic # of ms and return formatted MM:SS
    // this function stolen from auto-kick-unassigned, tyvm!
    let min = Math.floor((ms / 1000 / 60) << 0);
    let sec = Math.floor((ms / 1000) % 60);
    min = ('' + min).padStart(2, '0');
    sec = ('' + sec).padStart(2, '0');
    return `${min}:${sec}`;
  }
}
