import {
  LOG_PARSER_PLAYER_UNPOSSESS
} from '../../events/log-parser.js';

export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQPlayerController::)?OnUnPossess\(\): PC=(.+)/,
  onMatch: async (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      player: await logParser.server.getPlayerByName(args[3], true),
      switchPossess: false
    };

    if(args[3] in logParser.eventStore && logParser.eventStore[args[3]] === args[2]) data.switchPossess = true;
    delete logParser.eventStore[args[3]];

    logParser.server.emit(LOG_PARSER_PLAYER_UNPOSSESS, data);
  }
};
