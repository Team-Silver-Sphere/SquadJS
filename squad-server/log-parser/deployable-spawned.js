import { iterateIDs, capitalID } from 'core/id-parser';

// Example:
// [2026.10.01-12.00.00:000][123]LogSquad: Deployable BP_FOBRadio_Woodland_C_2147 spawned for team 1 at location {X=1.0,Y=2.0,Z=3.0} by player SomeName (ID: 42, OnlineIDs: EOS: 0002... steam: 7656...)
export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]Log\w+: .*?Deployable (\S+) spawned for team (\d+) at location \{([^}]*)\} by player (.+) \(ID: (\d+), Online ?IDs:([^)]*)\)/,
  onMatch: (args, logParser) => {
    const numbers = (args[5].match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi) || []).map(parseFloat);

    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      deployable: args[3],
      deployableClassname: args[3].replace(/_C_\d+$/, ''),
      teamID: args[4],
      location: { x: numbers[0], y: numbers[1], z: numbers[2] },
      playerName: args[6],
      playerID: args[7]
    };

    iterateIDs(args[8]).forEach((platform, id) => {
      data['player' + capitalID(platform)] = id;
    });

    logParser.emit('DEPLOYABLE_SPAWNED', data);
  }
};
