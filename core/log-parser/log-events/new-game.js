export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogWorld: Bringing World \/([A-z]+)\/(?:Maps\/)?([A-z0-9-]+)\/(?:.+\/)?([A-z0-9-]+)(?:\.[A-z0-9-]+)/,
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
      mapClassname: args[4],
      layerClassname: args[5]
    };

    delete logParser.eventStore.WON;

    logParser.emit('NEW_GAME', data);
    logParser.clearEventStore();
  }
};
