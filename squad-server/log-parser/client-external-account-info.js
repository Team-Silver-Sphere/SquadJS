export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]+)]LogEOS: Verbose: \[LogEOSConnect] FConnectClient::CacheExternalAccountInfo - ProductUserId: (?<eosId>[0-9a-f]{32}), AccountType: (\d), AccountId: (?<steamId>[0-9]{17}), DisplayName: <Redacted>/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      eosID: args.groups.eosId,
      steamID: args.groups.steamId
    };

    logParser.eventStore.players[data.steamID] = {
      eosID: data.eosID,
      steamID: data.steamID
    };
    logParser.eventStore.playersEOS[data.eosID] = logParser.eventStore.players[data.steamID];

    logParser.emit('CLIENT_EXTERNAL_ACCOUNT_INFO', data);
  }
};
