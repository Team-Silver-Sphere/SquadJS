// `anyIDs` is [id1, id2, ...], players is [player1, player2, ...]
// Purely brute force approach, `6*NUM_PLAYERS` attribubes to compare
// against `anyIDs` in worst case scenario given there are steam and
// EOS ids. ID mapping could be cached to speed up if needed.
export function anyIDsToPlayers(anyIDs, players) {
  const result = [];
  for (const player of players) {
    for (const idName in player) {
      if (!idName.endsWith('ID')) continue;
      if (player[idName] in anyIDs) {
        result.push(player);
        break;
      }
    }
  }
  return result;
}

// Same issue with brute force approach
export function anyIDToPlayer(anyID, players) {
  for (const player of players) {
    for (const idName in player) {
      if (!idName.endsWith('ID')) continue;
      if (player[idName] === anyID) return player;
    }
  }
}
