export default {
  regex:
  /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: Player:(.+) ActualDamage=([0-9.]+) from (.+) \(Online IDs: EOS: ([a-z0-9]{32}) steam: ([0-9]{17}) \| Player Controller ID: BP_PlayerController_C_([0-9]+)\)caused by ([A-z_0-9-]+)_C/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      victimName: args[3],
      damage: parseFloat(args[4]),
      attackerName: args[5],
      EOS: args[6],
      steam: args[7],
      weapon: args[8]
    };

    logParser.eventStore.session[args[3]] = data;

    logParser.emit('PLAYER_DAMAGED', data);
  }
};
