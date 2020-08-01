export default async function(server, discordClient, channelID, options = {}) {
  if (!server) throw new Error('DiscordRCON must be provided with a reference to the server.');
  if (!discordClient) throw new Error('DiscordRCON must be provided with a Discord.js client.');
  if (!channelID) throw new Error('DiscordRCON must be provided with a channel ID.');

  options = {
    prependAdminNameInBroadcast: false,
    ...options
  };

  discordClient.on('message', async message => {
    if (message.author.bot || message.channel.id !== channelID) return;

    let command = message.content;

    if(options.prependAdminNameInBroadcast && command.toLowerCase().startsWith('adminbroadcast'))
      command = command.replace(/^AdminBroadcast /i, `AdminBroadcast ${message.member.displayName}: `);

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
