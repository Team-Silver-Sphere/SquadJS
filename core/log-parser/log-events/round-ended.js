/**
 * Matches when Map state Changes to PostMatch (ScoreBoard)
 *
 * Emits winner and loser from eventstore
 *
 * winner and loser may be null if the match ends with a draw
 */
export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogGameState: Match State Changed from InProgress to WaitingPostMatch/,
  onMatch: (args, logParser) => {
    const data = {
      winner: logParser.eventStore.ROUND_WINNER ? logParser.eventStore.ROUND_WINNER : null,
      loser: logParser.eventStore.ROUND_LOSER ? logParser.eventStore.ROUND_LOSER : null,
      time: args[1]
    };
    logParser.emit('ROUND_ENDED', data);
    delete logParser.eventStore.ROUND_WINNER;
    delete logParser.eventStore.ROUND_LOSER;
  }
};
