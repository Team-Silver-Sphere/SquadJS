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
      if (message.author.bot || message.channel.id !== options.channelID) return;

      let command = message.content;

      if (options.prependAdminNameInBroadcast)
        command = command.replace(
          /^AdminBroadcast /i,
          `AdminBroadcast ${message.member.displayName}: `
        );

      const response = await server.rcon.execute(command);

      await this.respondToMessage(message, response);
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
