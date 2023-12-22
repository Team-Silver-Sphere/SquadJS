export default {
  regex:
  /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: PostLogin: NewPlayer: BP_PlayerController_C .+(BP_PlayerController_C_[0-9]+) \(IP: ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+) \| Online IDs: EOS: ([a-z0-9]{32}) steam: ([0-9]{17})\)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      controller: args[3],
      playerIP: args[4],
      playerEOS: args[5],
      playerSteam: args[6]
    };

    logParser.eventStore['player-controller'] = args[3];

    logParser.emit('PLAYER_CONTROLLER_CONNECTED', data);
  }
};
