export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQPlayerController::)?OnPossess\(\): PC=(.+) \(Online IDs: EOS: ([\w\d]{32}) steam: (\d{17})\) Pawn=([A-z0-9_]+)_C/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      playerSuffix: args[3],
      playerEOSID: args[4],
      playerSteamID: args[5],
      possessClassname: args[6],
      pawn: args[5]
    };

    logParser.eventStore.session[args[3]] = args[2];

    logParser.emit('PLAYER_POSSESS', data);
  }
};
