import { LOG_PARSER_PLAYER_REVIVED } from '../../events/log-parser.js';

export default {
  // the names are currently the wrong way around in these logs
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: (.+) has revived (.+)\./,
  onMatch: async (args, logParser) => {
    const data = {
      ...logParser.eventStore[args[3]],
      raw: args[0],
      time: args[1],
      chainID: args[2],
      victim: await logParser.server.getPlayerByName(args[4]),
      reviver: await logParser.server.getPlayerByName(args[3])
    };

    logParser.server.emit(LOG_PARSER_PLAYER_REVIVED, data);
  }
};
