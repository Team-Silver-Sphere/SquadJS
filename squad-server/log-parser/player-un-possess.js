export default {
  regex:
  /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQPlayerController::)?OnUnPossess\(\): PC=(.+) \(Online IDs: EOS: ([a-z0-9]{32}) steam: ([0-9]{17})\)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      playerSuffix: args[3],
      playerEOS: args[4],
      playerSteam: args[5],
      switchPossess:
        args[3] in logParser.eventStore.session && logParser.eventStore.session[args[3]] === args[2]
    };

    delete logParser.eventStore.session[args[3]];

    logParser.emit('PLAYER_UNPOSSESS', data);
  }
};
