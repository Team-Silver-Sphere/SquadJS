export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogNet: Join succeeded: (.+)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: +args[2],
      playerSuffix: args[3]
    };

    const joinRequestsData = { ...logParser.eventStore.joinRequests[data.chainID] };

    data.eosID = joinRequestsData.eosID;
    data.controller = joinRequestsData.controller;
    data.steamID = `${logParser.eventStore.connectionIdToSteamID.get(joinRequestsData.connection)}`;

    logParser.eventStore.connectionIdToSteamID.delete(joinRequestsData.connection);

    delete logParser.eventStore.joinRequests[+data.chainID];

    // Handle Reconnecting players
    if (logParser.eventStore.disconnected[data.steamID]) {
      delete logParser.eventStore.disconnected[data.steamID];
    }

    logParser.emit('JOIN_SUCCEEDED', data);
  }
};
