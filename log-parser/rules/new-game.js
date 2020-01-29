import { LOG_PARSER_NEW_GAME } from 'core/events/log-parser';

import InjuryManager from '../utils/injury-manager.js';

export default {
  regex: /\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer]ASQGameMode::StartNewGame\(\): ServerTravel to \/[A-z]+\/Maps\/([A-z_]+)\/([A-z0-9_]+)/,
  action: (args, logParser) => {
    /* Reset injury manager */
    logParser.injuryManager = new InjuryManager();

    /* Emit new game event */
    logParser.emit(LOG_PARSER_NEW_GAME, {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      map: args[3],
      layer: args[4]
    });
  }
};
