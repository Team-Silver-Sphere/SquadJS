export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogWorld: Bringing World \/([A-z0-9]+)\/(?:Maps\/)?([A-z0-9-]+)\/(?:.+\/)?([A-z0-9-]+)(?:\.[A-z0-9-]+)/,
  onMatch: (args, logParser) => {
    if (args[5] === 'TransitionMap') {
      return;
    }
    const data = {
      ...logParser.eventStore.WON,
      raw: args[0],
      time: args[1],
      chainID: args[2],
      dlc: args[3],
      // Map plugins have no map folder (/Harju/Maps/Gameplay_Layers/Harju_AAS_v3), so the plugin folder is the map.
      mapClassname: args[4] === 'Gameplay_Layers' ? args[3] : args[4],
      layerClassname: args[5]
    };

    delete logParser.eventStore.WON;

    logParser.emit('NEW_GAME', data);
    logParser.clearEventStore();
  }
};
