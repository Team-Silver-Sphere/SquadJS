export default {
  regex:
  /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQSoldier::)?Wound\(\): Player:(.+) KillingDamage=(?:-)*([0-9.]+) from ([A-z_0-9]+) \(Online IDs: EOS: ([a-z0-9]{32}) steam: ([0-9]{17}) \| Controller ID: BP_PlayerController_C_([0-9]+)\) caused by ([A-z_0-9-]+)_C/,
  onMatch: (args, logParser) => {
    const data = {
      ...logParser.eventStore.session[args[3]],
      raw: args[0],
      time: args[1],
      chainID: args[2],
      victimName: args[3],
      damage: parseFloat(args[4]),
      attackerPlayerController: args[5],
      attackerEOS: args[6],
      attackerSteam: args[7],
      attackerControllerID: args[8],
      weapon: args[9]
    };

    logParser.eventStore.session[args[3]] = data;

    logParser.emit('PLAYER_WOUNDED', data);
  }
};
