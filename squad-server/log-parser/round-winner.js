/**
 * Squad can write two DetermineMatchWinner lines at the end of a round with the same timestamp,
 * for example "The game was a draw on <map>" followed by "<faction> won on <map>". The last line
 * is the final result, so each line overwrites the previous one. A draw sets winner to null.
 */
export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQGameMode::)?DetermineMatchWinner\(\): (?:The game was a draw on (.+)|(.+) won on (.+))/,
  onMatch: (args, logParser) => {
    logParser.eventStore.WON = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      winner: args[4] || null,
      layer: args[3] || args[5]
    };
  }
};
