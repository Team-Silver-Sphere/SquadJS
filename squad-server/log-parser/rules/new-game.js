import SquadLayers from 'connectors/squad-layers';

import { LOG_PARSER_NEW_GAME } from '../../events/log-parser.js';

import InjuryManager from '../utils/injury-manager.js';

export default {
  regex: /\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer]ASQGameMode::StartNewGame\(\): ServerTravel to \/[A-z]+\/Maps\/([A-z_]+)\/([A-z0-9_]+)/,
  action: async (args, logParser) => {
    /* Reset injury manager */
    logParser.injuryManager = new InjuryManager();

    const layer = SquadLayers.getLayerByLayerClassname(args[4]);

    /* Emit new game event */
    logParser.emit(LOG_PARSER_NEW_GAME, {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      map: layer.map,
      layer: layer.layer
    });
  }
};
