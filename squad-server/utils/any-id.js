import { playerIdNames } from 'core/id-parser';

/**
 * Check if given ID belongs to a player.
 * @arg {string} anyID - an ID to match against.
 * @arg {Player} player - a player to check.
 * returns {boolean}
 */
export function isPlayerID(anyID, player) {
  for (const idName of playerIdNames) {
    if (player[idName] === anyID) return true;
  }
  return false;
}

/**
 * Filter out players matching given IDs.
 * Note: uses linear search, not the most efficent approach.
 * @arg {string[]} anyIDs - IDs to match against.
 * @arg {Player[]} players
 * @returns {Player[]}
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
 * @arg {Player[]} players
 * @returns {(Player|undefined)}
 */
export function anyIDToPlayer(anyID, players) {
  for (const player of players) {
    if (isPlayerID(anyID, player)) return player;
  }
}
