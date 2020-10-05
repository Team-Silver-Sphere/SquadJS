export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQPlayerController::)?OnUnPossess\(\): PC=(.+)/,
  onMatch: async (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      playerSuffix: args[3],
      switchPossess: args[3] in logParser.eventStore && logParser.eventStore[args[3]] === args[2]
    };

    delete logParser.eventStore[args[3]];

    logParser.emit('PLAYER_UNPOSSESS', data);
  }
};
