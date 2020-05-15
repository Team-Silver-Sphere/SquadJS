import { LOG_PARSER_SERVER_TICK_RATE } from '../../events/log-parser.js';

export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: USQGameState: Server Tick Rate: ([0-9.]+)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      tickRate: parseFloat(args[3])
    };

    logParser.server.emit(LOG_PARSER_SERVER_TICK_RATE, data);
  }
};
