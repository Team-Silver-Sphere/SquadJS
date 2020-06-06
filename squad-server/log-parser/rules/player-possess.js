import { LOG_PARSER_PLAYER_POSSESS } from '../../events/log-parser.js';

export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQPlayerController::)?OnPossess\(\): PC=(.+) Pawn=([A-z0-9_]+)_C/,
  onMatch: async (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      player: await logParser.server.getPlayerByName(args[3], true),
      possessClassname: args[4]
    };

    logParser.eventStore[args[3]] = args[2];

    logParser.server.emit(LOG_PARSER_PLAYER_POSSESS, data);
  }
};
