export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: Player:(.+) ActualDamage=([0-9.]+) from (.+) \(Online IDs: EOS: ([0-9a-f]{32}) steam: (\d{17}) \| Player Controller ID: ([^ ]+)\)caused by ([A-z_0-9-]+)_C/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      victimName: args[3],
      damage: parseFloat(args[4]),
      attackerName: args[5],
      attackerEOSID: args[6],
      attackerSteamID: args[7],
      attackerController: args[8],
      weapon: args[9]
    };

    logParser.eventStore.session[args[3]] = data;

    logParser.emit('PLAYER_DAMAGED', data);
  }
};
