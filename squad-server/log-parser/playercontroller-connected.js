export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: PostLogin: NewPlayer: BP_PlayerController_C .+(BP_PlayerController_C_[0-9]+)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      controller: args[3]
    };

    logParser.eventStore['player-controller'] = args[3];

    logParser.emit('PLAYER_CONTROLLER_CONNECTED', data);
  }
};
