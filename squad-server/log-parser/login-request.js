export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogNet: Login request: \?Name=(.+) userId: RedpointEOS:([\da-f]{32}) platform: RedpointEOS/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: +args[2],
      suffix: args[3],
      eosID: args[4]
    };

    // logParser.eventStore.loginRequests[ data.chainID ] = data;
    // console.log(logParser.eventStore.loginRequests[ data.chainID ])
    logParser.emit('CLIENT_LOGIN_REQUEST', data);
  }
};
