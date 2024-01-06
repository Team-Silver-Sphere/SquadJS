export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQPlayerController::)?OnUnPossess\(\): PC=(.+) \(Online IDs: EOS: ([\w\d]{32}) steam: (\d{17})\)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      playerSuffix: args[3],
      playerEOSID: args[4],
      playerSteamID: args[5],
      switchPossess:
        args[4] in logParser.eventStore.session && logParser.eventStore.session[args[4]] === args[2]
    };

    delete logParser.eventStore.session[args[3]];

    logParser.emit('PLAYER_UNPOSSESS', data);
  }
};
