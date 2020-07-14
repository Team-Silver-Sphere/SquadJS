import { LOG_PARSER_ADMIN_BROADCAST } from '../../events/log-parser.js';

export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: ADMIN COMMAND: Message broadcasted <(.+)> from (.+)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      message: args[3],
      from: args[4]
    };

    logParser.server.emit(LOG_PARSER_ADMIN_BROADCAST, data);
  }
};
