import { iterateIDs, capitalID } from 'core/id-parser';

export default {
  // the names are currently the wrong way around in these logs
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: (.+) \(Online IDs:([^)]+)\) has revived (.+) \(Online IDs:([^)]+)\)\./,
  onMatch: (args, logParser) => {
    const data = {
      ...logParser.eventStore.session[args[3]],
      raw: args[0],
      time: args[1],
      chainID: args[2],
      reviverName: args[3],
      victimName: args[5]
    };
    iterateIDs(args[4]).forEach((platform, id) => {
      data['reviver' + capitalID(platform)] = id;
    });
    iterateIDs(args[6]).forEach((platform, id) => {
      data['victim' + capitalID(platform)] = id;
    });

    logParser.emit('PLAYER_REVIVED', data);
  }
};
