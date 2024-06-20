export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogNet: Join succeeded: (.+)/,
  onMatch: (args, logParser) => {
    const chainID = +args[2];

    // Fetch Player by It's chainID
    const player = logParser.eventStore.joinRequests[chainID];
    delete logParser.eventStore.joinRequests[chainID]; // auth done, no longer needed

    const data = {
      raw: args[0],
      time: args[1],
      chainID: chainID,
      playerSuffix: args[3],
      ...player
    };

    player.playerSuffix = data.playerSuffix;

    logParser.emit('JOIN_SUCCEEDED', data);
  }
};
