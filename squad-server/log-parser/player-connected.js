export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogNet: Join succeeded: (.+)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      playerSuffix: args[3],
      steamID: logParser.eventStore['client-login'], // player connected
      controller: logParser.eventStore['player-controller'] // playercontroller connected
    };

    delete logParser.eventStore['client-login'];
    delete logParser.eventStore['player-controller'];

    // Handle Reconnecting players
    if (logParser.eventStore.disconnected[data.steamID]) {
      delete logParser.eventStore.disconnected[data.steamID];
    }
    logParser.emit('PLAYER_CONNECTED', data);
    logParser.eventStore.players[data.steamID] = {
      steamID: data.steamID,
      suffix: data.playerSuffix,
      controller: data.controller
    };
  }
};
