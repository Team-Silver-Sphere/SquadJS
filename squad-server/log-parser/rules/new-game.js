import { SquadLayers } from 'core/squad-layers';

import { LOG_PARSER_NEW_GAME } from '../../events/log-parser.js';

export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogWorld: Bringing World \/([A-z]+)\/Maps\/([A-z]+)\/(?:Gameplay_Layers\/)?([A-z0-9_]+)/,
  onMatch: (args, logParser) => {
    const layer = SquadLayers.getLayerByLayerClassname(args[5]);

    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      dlc: args[3],
      mapClassname: args[4],
      layerClassname: args[5],
      map: layer ? layer.map : null,
      layer: layer ? layer.layer : null
    };

    /* Emit new game event */
    logParser.server.emit(LOG_PARSER_NEW_GAME, data);
  }
};
