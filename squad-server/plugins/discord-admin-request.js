import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordAdminRequest extends DiscordBasePlugin {
  static get description() {
    return (
      'The <code>DiscordAdminRequest</code> plugin will ping admins in a Discord channel when a player requests ' +
      'an admin via the <code>!admin</code> command in in-game chat.'
    );
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelID: {
        required: true,
        description: 'The ID of the channel to log admin broadcasts to.',
        default: '',
        example: '667741905228136459'
      },
      ignoreChats: {
        required: false,
        description: 'A list of chat names to ignore.',
        default: [],
        example: ['ChatSquad']
      },
      ignorePhrases: {
        required: false,
        description: 'A list of phrases to ignore.',
        default: [],
        example: ['switch']
      },
      command: {
        required: false,
        description: 'The command that calls an admin.',
        default: 'admin'
      },
      pingGroups: {
        required: false,
        description: 'A list of Discord role IDs to ping.',
        default: [],
        example: ['500455137626554379']
      },
      pingHere: {
        required: false,
        description:
          'Ping @here. Great if Admin Requests are posted to a Squad Admin ONLY channel, allows pinging only Online Admins.',
        default: false
      },
      pingDelay: {
        required: false,
        description: 'Cooldown for pings in milliseconds.',
        default: 60 * 1000
      },
      color: {
        required: false,
        description: 'The color of the embed.',
        default: 16761867
      },
      warnInGameAdmins: {
        required: false,
        description:
          'Should in-game admins be warned after a players uses the command and should we tell how much admins are active in-game right now.',
        default: false
      },
      showInGameAdmins: {
        required: false,
        description: 'Should players know how much in-game admins there are active/online?',
        default: true
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.lastPing = Date.now() - this.options.pingDelay;

    this.onChatCommand = this.onChatCommand.bind(this);
  }

  async mount() {
    this.server.on(`CHAT_COMMAND:${this.options.command}`, this.onChatCommand);
  }

  async unmount() {
    this.server.removeListener(`CHAT_COMMAND:${this.options.command}`, this.onChatCommand);
  }

  async onChatCommand(info) {
    if (this.options.ignoreChats.includes(info.chat)) return;

    for (const ignorePhrase of this.options.ignorePhrases) {
      if (info.message.includes(ignorePhrase)) return;
    }

    if (info.message.length === 0) {
      await this.server.rcon.warn(
        info.player.eosID,
        `Please describe what you need help with when requesting an admin.`
      );
      return;
    }

    const admins = this.server.getAdminsWithPermission('canseeadminchat', 'eosID');
    const warningMessage = `[${info.player.name}] - ${info.message}`;
    let amountAdmins = 0;
    let adminsInSquadExist = false;
    let undesignatedAdmins = [];

    // Loop through all players
    for (const player of this.server.players) {
      // Skip the loop cycle if not admin
      if (!admins.includes(player.eosID)) continue;
      amountAdmins++;

      // Send the in-game message only if warnInGameAdmins option is turned on
      if (this.options.warnInGameAdmins) {
        const squadName = player.squad?.squadName;

        // If an admin is inside an 'admin' squad, send the in-game message
        // Save all admins not in an 'admin' squad in case there's no matches after the loop is done
        // If the squad has 'admin' in the name, it counts as an 'admin' squad (case insensitive)
        if (
          typeof squadName === 'string' &&
          (squadName.toUpperCase().includes('ADMIN') ||
           squadName.toUpperCase().includes('NIMDA') ||
           squadName.toUpperCase().includes('AMDIN'))
        ) {
          adminsInSquadExist = true;
          await this.server.rcon.warn(player.eosID, warningMessage);
        }
        else {
          undesignatedAdmins.push(player.eosID);
        }
      }
    }

    // If there's no admins in an 'admin' squad, send notification to all admins online
    if (this.options.warnInGameAdmins && !adminsInSquadExist && undesignatedAdmins.length > 0) {
      for (const admin of undesignatedAdmins) {
        await this.server.rcon.warn(admin, warningMessage);
      }
    }

    const message = {
      embed: {
        color: this.options.color,
        fields: [
          {
            name: 'Player',
            value: info.player.name,
            inline: true
          },
          {
            name: 'SteamID',
            value: `[${info.player.steamID}](https://battlemetrics.com/rcon/players?filter[search]=${info.player.steamID}&method=quick&redirect=1)`,
            inline: true
          },
          {
            name: 'Team & Squad',
            value: `Team ${info.player.teamID}, Squad ${info.player.squadID || 'Unassigned'}`,
            inline: true
          },
          {
            name: 'Admin Request',
            value: info.message
          },
          {
            name: 'Admins Online',
            value: amountAdmins
          }
        ]
      }
    };

    if (this.options.pingGroups.length > 0 && Date.now() - this.options.pingDelay > this.lastPing) {
      if (this.options.pingHere === true && this.options.pingGroups.length === 0) {
        message.content = `@here - Admin Requested in ${this.server.serverName}`;
      } else if (this.options.pingHere === true && this.options.pingGroups.length > 0) {
        message.content = `@here - Admin Requested in ${
          this.server.serverName
        } - ${this.options.pingGroups.map((groupID) => `<@&${groupID}>`).join(' ')}`;
      } else if (this.options.pingHere === false && this.options.pingGroups.length === 0) {
        message.content = `Admin Requested in ${this.server.serverName}`;
      } else if (this.options.pingHere === false && this.options.pingGroups.length > 0) {
        message.content = `Admin Requested in ${this.server.serverName} - ${this.options.pingGroups
          .map((groupID) => `<@&${groupID}>`)
          .join(' ')}`;
      }
      this.lastPing = Date.now();
    }

    await this.sendDiscordMessage(message);

    if (amountAdmins === 0 && this.options.showInGameAdmins)
      await this.server.rcon.warn(
        info.player.eosID,
        `There are no in-game admins, please join our discord and send us a message in #contact-admins`
      );
    /* else if (this.options.showInGameAdmins)
      await this.server.rcon.warn(
        info.player.eosID,
        `There ${amountAdmins > 1 ? 'are' : 'is'} ${amountAdmins} in-game admin${
          amountAdmins > 1 ? 's' : ''
        }. Please wait for us to get back to you.`
      ); */
    else
      await this.server.rcon.warn(
        info.player.eosID,
        //`An admin has been notified. Please wait for us to get back to you.`
        `Save clips/screenshots then send us a message in #contact-admins on Discord`
      );
  }
}
