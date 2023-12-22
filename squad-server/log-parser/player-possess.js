export default {
  regex:
  /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQPlayerController::)?OnPossess\(\): PC=(.+) \(Online IDs: EOS: ([a-z0-9]{32}) steam: ([0-9]{17})\) Pawn=([A-z0-9_]+)_C/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      playerSuffix: args[3],
      playerEOS: args[4],
      playerSteam: args[5],
      pawn: args[6]
    };

    logParser.eventStore.session[args[3]] = args[2];

    logParser.emit('PLAYER_POSSESS', data);
  }
};
