export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQDeployable::)?TakeDamage\(\): ([A-z0-9_]+)_C_[0-9]+: ([0-9.]+) damage attempt by causer ([A-z0-9_]+)_C_[0-9]+ instigator (.+) with damage type ([A-z0-9_]+)_C health remaining ([0-9.]+)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      deployable: args[3],
      damage: parseFloat(args[4]),
      weapon: args[5],
      playerSuffix: args[6],
      damageType: args[7],
      healthRemaining: args[8]
    };

    logParser.eventStore.session[args[3]] = data;

    logParser.emit('DEPLOYABLE_DAMAGED', data);
  }
};
