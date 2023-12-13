export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQSoldier::)?Die\(\): Player:(.+) KillingDamage=(?:-)*([0-9.]+) from ([A-z_0-9]+) \(Online IDs: EOS: ([\w\d]{32}) steam: (\d{17}) \| Contoller ID: ([\w\d]+)\) caused by ([A-z_0-9-]+)_C/,
  onMatch: (args, logParser) => {
    const data = {
      ...logParser.eventStore.session[args[3]],
      raw: args[0],
      time: args[1],
      woundTime: args[1],
      chainID: args[2],
      victimName: args[3],
      damage: parseFloat(args[4]),
      attackerPlayerController: args[5],
      attackerEOSID: args[6],
      attackerSteamID: args[7],
      weapon: args[9]
    };

    logParser.eventStore.session[args[3]] = data;

    logParser.emit('PLAYER_DIED', data);
  }
};
