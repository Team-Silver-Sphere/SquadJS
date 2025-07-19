export default {
  regex: /^\[([0-9.:-]+)]\[([0-9]+)]LogSquadTrace: \[DedicatedServer\]TakeDamage\(\): ([A-Za-z0-9_]+)_C_[0-9]+: ([0-9.]+) damage (?:taken|attempt) by causer ([A-Za-z0-9_]+)_C_[0-9]+ instigator ([^()]+?)(?: \(Online IDs: EOS: ([a-f0-9]+) steam: (\d+)\))?(?: with damage type ([A-Za-z0-9_]+)_C)? health remaining ([0-9.]+)/,

  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: new Date(),
      chainID: args[2],
      deployable: args[3],
      damage: parseFloat(args[4]),
      weapon: args[5],
      player: {
        name: args[6]?.trim() || 'Unknown',
        eosID: args[7] || null,
        steamID: args[8] || null
      },
      damageType: args[9] || 'Unknown',
      healthRemaining: parseFloat(args[10])
    };

    logParser.eventStore.session[args[3]] = data;
    logParser.emit('DEPLOYABLE_DAMAGED', data);
  }
};
