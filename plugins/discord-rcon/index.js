export default {
  name: 'discord-rcon',
  description: 'This plugin turns a Discord channel into a RCON console.',
  defaultDisabled: false,

  optionsSpec: {
    discordClient: {
      type: 'DiscordConnector',
      required: true,
      default: 'discord',
      description: 'The name of the Discord Connector to use.'
    },
    channelID: {
      type: 'Discord Channel ID',
      required: true,
      default: 'Discord Channel ID',
      description: 'The ID of the channel you wish to turn into a RCON console.'
    },
    prependAdminNameInBroadcast: {
      type: 'Boolean',
      required: false,
      default: false,
      description: "Prepend the admin's name when he makes an announcement."
    }
  },

  init: async (server, options) => {
    options.discordClient.on('message', async (message) => {
      if (message.author.bot || message.channel.id !== options.channelID) return;

      let command = message.content;

      if (options.prependAdminNameInBroadcast && command.toLowerCase().startsWith('adminbroadcast'))
        command = command.replace(
          /^AdminBroadcast /i,
          `AdminBroadcast ${message.member.displayName}: `
        );

      const response = await server.rcon.execute(command);

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

      for (const responseMessage of responseMessages) {
        await message.channel.send(`\`\`\`${responseMessage}\`\`\``);
      }
    });
  }
};
