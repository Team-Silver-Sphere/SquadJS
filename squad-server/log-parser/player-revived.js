export default {
  // the names are currently the wrong way around in these logs
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: (.+) \(Online IDs: EOS: ([a-z0-9]{32}) steam: ([0-9]{17})\) has revived (.+) \(Online IDs: EOS: ([a-z0-9]{32}) steam: ([0-9]{17})\)\./,
  onMatch: (args, logParser) => {
    const data = {
      ...logParser.eventStore.session[args[3]],
      raw: args[0],
      time: args[1],
      chainID: args[2],
      reviverName: args[3],
      reviverEOS: args[4],
      reviverSteam: args[5],
      victimName: args[6],
      victimEOS: args[7],
      victimSteam: args[8]
    };

    logParser.emit('PLAYER_REVIVED', data);
  }
};
