import { LOG_PARSER_PLAYER_CONNECTED } from '../../events/log-parser.js';

export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogNet: Join succeeded: (.+)/,
  onMatch: async (args, logParser) => {
    logParser.server.suffixStore[logParser.eventStore['steamid-connected']] =
      args[3];

    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      player: await logParser.server.getPlayerByName(args[3], true)
    };

    logParser.server.emit(LOG_PARSER_PLAYER_CONNECTED, data);
  }
};
