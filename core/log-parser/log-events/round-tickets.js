/**
 * Matches when tickets appear in the log
 *
 * Will not match on Draw or Map Changes before the game has started
 */
export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadGameEvents: Display: Team ([0-9]), (.*) \( ?(.*?) ?\) has (won|lost) the match with ([0-9]+) Tickets on layer (.*) \(level (.*)\)!/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      team: args[3],
      subfaction: args[4],
      faction: args[5],
      action: args[6],
      tickets: args[7],
      layer: args[8],
      level: args[9]
    };
    if (data.action === 'won') {
      logParser.eventStore.ROUND_WINNER = data;
    } else {
      logParser.eventStore.ROUND_LOSER = data;
    }
  }
};
