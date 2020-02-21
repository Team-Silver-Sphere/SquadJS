import SquadLayers from 'connectors/squad-layers';

import { LOG_PARSER_NEW_GAME } from '../../events/log-parser.js';

import InjuryHandler from '../utils/injury-handler.js';

export default {
  regex: /\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer]ASQGameMode::StartNewGame\(\): ServerTravel to \/[A-z]+\/Maps\/([A-z_]+)\/([A-z0-9_]+)/,
  action: async (args, logParser) => {
    /* Reset injury manager */
    logParser.injuryHandler = new InjuryHandler();

    const layer = SquadLayers.getLayerByLayerClassname(args[4]);

    /* Emit new game event */
    logParser.emitter.emit(LOG_PARSER_NEW_GAME, {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      map: layer.map,
      layer: layer.layer
    });
  }
};
