export default {
  // eslint-disable-next-line
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogWorld: Bringing World \/([A-z\/]+)\/Maps\/([A-z]+)\/(?:Gameplay_Layers\/)?([A-z0-9_]+)/,
  onMatch: (args, logParser) => {
    const data = {
      ...logParser.eventStore.WON,
      raw: args[0],
      time: args[1],
      chainID: args[2],
      dlc: args[3],
      mapClassname: args[4],
      layerClassname: args[5]
    };

    delete logParser.eventStore.WON;

    logParser.emit('NEW_GAME', data);
  }
};
