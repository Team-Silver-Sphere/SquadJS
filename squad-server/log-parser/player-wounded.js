import { iterateIDs, capitalID } from 'core/id-parser';

export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQSoldier::)?Wound\(\): Player:(.+) KillingDamage=(?:-)*([0-9.]+) from ([A-z_0-9]+) \(Online IDs:([^)|]+)\| Controller ID: ([\w\d]+)\) caused by ([A-z_0-9-]+)_C/,
  onMatch: (args, logParser) => {
    if (args[6].includes('INVALID')) return; // bail in case of bad IDs.
    const data = {
      ...logParser.eventStore.session[args[3]],
      raw: args[0],
      time: args[1],
      chainID: args[2],
      victimName: args[3],
      damage: parseFloat(args[4]),
      attackerPlayerController: args[5],
      weapon: args[8]
    };

    logParser.eventStore.session[args[3]] = data;
    iterateIDs(args[6]).forEach((platform, id) => {
      data['attacker' + capitalID(platform)] = id;
    });

    logParser.emit('PLAYER_WOUNDED', data);
  }
};
