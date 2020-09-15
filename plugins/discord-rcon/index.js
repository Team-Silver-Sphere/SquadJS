export default {
  name: 'discord-rcon',
  description:
    'The <code>discord-rcon</code> plugin allows a specified Discord channel to be used as a RCON console to run ' +
    'RCON commands.',

  defaultEnabled: true,
  optionsSpec: {
    discordClient: {
      required: true,
      description: 'The name of the Discord Connector to use.',
      default: 'discord'
    },
    channelID: {
      required: true,
      description: 'The ID of the channel you wish to turn into a RCON console.',
      default: '',
      example: '667741905228136459'
    },
    prependAdminNameInBroadcast: {
      required: false,
      description: "Prepend the admin's name when he makes an announcement.",
      default: false
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
