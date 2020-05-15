export default async function plugin(
  server,
  discordClient,
  channelID,
  events = []
) {
  if (!server)
    throw new Error(
      'DiscordDebug must be provided with a reference to the server.'
    );

  if (!discordClient)
    throw new Error('DiscordDebug must be provided with a Discord.js client.');

  if (!channelID)
    throw new Error('DicordDebug must be provided with a channel ID.');

  const channel = await discordClient.channels.fetch(channelID);

  for (const event of events) {
    server.on(event, info => {
      channel.send(`\`\`\`${JSON.stringify(info, null, 2)}\`\`\``);
    });
  }
}
