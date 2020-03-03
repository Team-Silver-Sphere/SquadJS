import DiscordConnector from 'connectors/discord';

export default async function plugin(server, channelID, events = []) {
  if (!server)
    throw new Error(
      'DiscordDebug must be provided with a reference to the server.'
    );

  if (!channelID)
    throw new Error('DicordDebug must be provided with a channel ID.');

  const channel = await (await DiscordConnector.getClient()).channels.get(
    channelID
  );

  for (const event of events) {
    server.on(event, info => {
      channel.send(`\`\`\`${JSON.stringify(info, null, 2)}\`\`\``);
    });
  }
}
