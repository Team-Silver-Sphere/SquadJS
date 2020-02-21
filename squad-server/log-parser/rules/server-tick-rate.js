import { LOG_PARSER_TICK_RATE } from '../../events/log-parser.js';

export default {
  regex: /\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: USQGameState: Server Tick Rate: ([0-9.]+)/,
  action: (args, logParser) => {
    logParser.emitter.emit(LOG_PARSER_TICK_RATE, {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      tickRate: parseFloat(args[3])
    });
  }
};
