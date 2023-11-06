export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogNet: Join succeeded: (.+)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[ 0 ],
      time: args[ 1 ],
      chainID: +args[ 2 ],
      playerSuffix: args[ 3 ]
    };

    // console.log(`ChainID: ${data.chainID}`, logParser.eventStore.joinRequests[ data.chainID ]);
    const joinRequestsData = { ...logParser.eventStore.joinRequests[ data.chainID ] };
    // console.log('loginRequestData', loginRequestData)

    data.eosID = joinRequestsData.eosID
    data.controller = joinRequestsData.controller
    data.steamID = `${logParser.eventStore.connectionIdToSteamID.get(joinRequestsData.connection)}`

    logParser.eventStore.connectionIdToSteamID.delete(joinRequestsData.connection)

    delete logParser.eventStore.joinRequests[ +data.chainID ];

    // Handle Reconnecting players
    if (logParser.eventStore.disconnected[ data.steamID ]) {
      delete logParser.eventStore.disconnected[ data.steamID ];
    }
    logParser.emit('PLAYER_CONNECTED', data);
    // logParser.eventStore.players[ data.steamID ].suffix = data.playerSuffix
    // logParser.eventStore.players[ data.steamID ].controller = data.controller
  }
};
