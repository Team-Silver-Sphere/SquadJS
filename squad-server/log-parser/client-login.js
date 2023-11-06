export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: Login: NewPlayer: EOSIpNetConnection \/Engine\/Transient\.(EOSIpNetConnection_[0-9]+)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[ 0 ],
      time: args[ 1 ],
      chainID: args[ 2 ],
      connection: args[ 3 ]
    };
    /* This is Called when a player begins the Login process
      We use this to get a SteamID into playerConnected.
      2nd Step in player connected path
      */

    logParser.eventStore.joinRequests[ data.chainID ].connection = data.connection;
    delete logParser.eventStore.clients[ args[ 3 ] ];
    logParser.emit('CLIENT_LOGIN', data);
  }
};
