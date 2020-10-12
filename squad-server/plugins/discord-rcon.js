import BasePlugin from './base-plugin.js';

export default class DiscordRcon extends BasePlugin {
  static get description() {
    return (
      'The <code>DiscordRcon</code> plugin allows a specified Discord channel to be used as a RCON console to ' +
      'run RCON commands'
    );
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      discordClient: {
        required: true,
        description: 'Discord connector name.',
        connector: 'discord',
        default: 'discord'
      },
      channelID: {
        required: true,
        description: 'ID of channel to turn into RCON console.',
        default: '',
        example: '667741905228136459'
      },
      permissions: {
        required: false,
        description:
          '<ul>' +
          '<li>Dictionary of roles and a list of the permissions they are allowed to use.' +
          '<li>If dictionary is empty (<code>{}</code>) permissions will be disabled</li>' +
          '<li>A list of available RCON commands can be found here <a>https://squad.gamepedia.com/Server_Administration#Admin_Console_Commands</a>.' +
          '</ul>',
        default: {},
        example: {
          '123456789123456789': ['AdminBroadcast', 'AdminForceTeamChange', 'AdminDemoteCommander']
        }
      },
      prependAdminNameInBroadcast: {
        required: false,
        description: 'Prepend admin names when making announcements.',
        default: false
      }
    };
  }

  constructor(server, options) {
    super();

    options.discordClient.on('message', async (message) => {
      // check the author of the message is not a bot and that the channel is the RCON console channel
      if (message.author.bot || message.channel.id !== options.channelID) return;

      let command = message.content;

      // write admin's name into broadcast command if prependAdminNameInBroadcast is enabled
      if (options.prependAdminNameInBroadcast)
        command = command.replace(
          /^AdminBroadcast /i,
          `AdminBroadcast ${message.member.displayName}: `
        );

      // check the admin has permissions
      if (Object.keys(options.permissions).length !== 0) {
        const commandPrefix = command.match(/([^ ]+)/);

        let hasPermission = false;
        for (const [role, allowedCommands] of Object.entries(options.permissions)) {
          if (!message.member._roles.includes(role)) continue;

          for (const allowedCommand of allowedCommands)
            if (commandPrefix[1].toLowerCase() === allowedCommand.toLowerCase())
              hasPermission = true;
        }

        if (!hasPermission) {
          await message.reply('you do not have permission to run that command.');
          return;
        }
      }

      // execute command and print response
      await this.respondToMessage(message, await server.rcon.execute(command));
    });
  }

  async respondToMessage(message, response) {
    for (const splitResponse of this.splitLongResponse(response))
      await message.channel.send(`\`\`\`${splitResponse}\`\`\``);
  }

  splitLongResponse(response) {
    const responseMessages = [''];

    for (const line of response.split('\n')) {
      if (responseMessages[responseMessages.length - 1].length + line.length > 1994) {
        responseMessages.push(line);
      } else {
        responseMessages[responseMessages.length - 1] = `${
          responseMessages[responseMessages.length - 1]
        }\n${line}`;
      }
    }

    return responseMessages;
  }
}
