export default {
  // the names are currently the wrong way around in these logs
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: (.+) \(Online IDs: EOS: ([0-9a-f]{32}) steam: (\d{17})\) has revived (.+) \(Online IDs: EOS: ([0-9a-f]{32}) steam: (\d{17})\)\./,
  onMatch: (args, logParser) => {
    const data = {
      ...logParser.eventStore.session[args[3]],
      raw: args[0],
      time: args[1],
      chainID: args[2],
      reviverName: args[3],
      reviverEOSID: args[4],
      reviverSteamID: args[5],
      victimName: args[6],
      victimEOSID: args[7],
      victimSteamID: args[8]
    };

    logParser.emit('PLAYER_REVIVED', data);
  }
};
