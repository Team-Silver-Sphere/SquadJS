import { playerIdNames } from 'core/id-parser';

/**
 * Filter out players matching given IDs.
 * Note: uses linear search, not the most efficent approach.
 * @arg {Array.<string>} anyIDs - IDs to match against.
 * @arg {Array.<Object>} players
 * @returns {Array.<Object>}
 */
export function anyIDsToPlayers(anyIDs, players) {
  const result = [];
  for (const player of players) {
    for (const idName of playerIdNames) {
      if (anyIDs.includes(player[idName]) && !result.includes(player)) {
        result.push(player);
        break;
      }
    }
  }
  return result;
}

/**
 * Find player by any of it's IDs.
 * @arg {string} anyID - ID to match against.
 * @arg {Array.<Object>} players
 * @returns {(Object|undefined)}
 */
export function anyIDToPlayer(anyID, players) {
  for (const player of players) {
    for (const idName of playerIdNames) {
      if (player[idName] === anyID) return player;
    }
  }
}
