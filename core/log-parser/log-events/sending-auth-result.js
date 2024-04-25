export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogOnline: STEAM: AUTH HANDLER: Sending auth result to user (\d{17}) with flag success\? 1/,
  onMatch: (args, logParser) => {
    if (!logParser.eventStore['last-connection']) return;

    const data = {
      ...logParser.eventStore['last-connection'],
      steamID: args[3]
    };
    /* This is Called when unreal engine adds a client connection
      First Step in Adding a Player to server
      */

    logParser.eventStore.clients[data.connection] = data.steamID;
    logParser.eventStore.connectionIdToSteamID.set(data.connection, data.steamID);
    logParser.emit('CLIENT_CONNECTED', data);

    delete logParser.eventStore['last-connection'];
  }
};
