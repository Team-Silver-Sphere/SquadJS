export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogNet: Join succeeded: (.+)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      playerSuffix: args[3],
      steamID: logParser.eventStore['steamid-connected']
    };

    logParser.eventStore[`player-name-tracker-${data.steamID}`] = data.playerSuffix;
    logParser.emit('PLAYER_CONNECTED', data);
  }
};
