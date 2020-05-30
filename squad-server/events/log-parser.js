/** Occurs when a new layer is loaded.
 *
 * Data:
 *  - time - Date object of when the event occurred.
 *  - dlc - DLC / Mod the layer was loaded from.
 *  - mapClassname - Classname of the map.
 *  - layerClassname - Classname of the layer.
 *  - map - Map name (if known).
 *  - layer - Layer name (if known).
 */
const LOG_PARSER_NEW_GAME = 'LOG_PARSER_NEW_GAME';

/** Occurs when a new player connects.
 *
 * Data:
 *  - time - Date object of when the event occurred.
 *  - player - PlayerObject of the player.
 */
const LOG_PARSER_PLAYER_CONNECTED = 'LOG_PARSER_PLAYER_CONNECTED';

/** Occurs when a player is damaged.
 *
 * Data:
 *  - time - Date object of when the event occurred.
 *  - victim - PlayerObject of the damaged player.
 *  - damage - Amount of damage inflicted.
 *  - attacker - PlayerObject of the attacking player.
 *  - weapon - The classname of the weapon used.
 */
const LOG_PARSER_PLAYER_DAMAGED = 'LOG_PARSER_PLAYER_DAMAGED';

/** Occurs when a player dies.
 *
 * Data:
 *  - time - Date object of when the event occurred.
 *  - woundTime - Date object of when the wound event occurred.
 *  - victim - PlayerObject of the damaged player.
 *  - damage - Amount of damage inflicted.
 *  - attacker - PlayerObject of the attacking player.
 *  - attackerPlayerController - PlayerController of the attacking player.
 *  - weapon - The classname of the weapon used.
 *  - teamkill - Whether the kill was a teamkill.
 *  - suicide - Was the kill a suicide.
 */
const LOG_PARSER_PLAYER_DIED = 'LOG_PARSER_PLAYER_DIED';

/** Occurs when a player possess a new object.
 *
 * Data:
 *  - time - Date object of when the event occurred.
 *  - player - PlayerObject of the admin.
 *  - possessClassname - Classname of the object.
 */
const LOG_PARSER_PLAYER_POSSESS = 'LOG_PARSER_PLAYER_POSSESS';

/** Occurs when a player is revived.
 *
 * Data:
 *  - time - Date object of when the event occurred.
 *  - woundTime - Date object of when the wound event occurred.
 *  - victim - PlayerObject of the damaged player.
 *  - damage - Amount of damage inflicted.
 *  - attacker - PlayerObject of the attacking player.
 *  - attackerPlayerController - PlayerController of the attacking player.
 *  - weapon - The classname of the weapon used.
 *  - teamkill - Whether the kill was a teamkill.
 *  - suicide - Was the kill a suicide.
 *  - reviver - PlayerObject of the reviving player.
 */
const LOG_PARSER_PLAYER_REVIVED = 'LOG_PARSER_PLAYER_REVIVED';

/** Occurs when a player unpossess an object.
 *
 * Data:
 *  - time - Date object of when the event occurred.
 *  - player - PlayerObject of the admin.
 *  - switchPossess - True if switching a possess.
 */
const LOG_PARSER_PLAYER_UNPOSSESS = 'LOG_PARSER_PLAYER_UNPOSSESS';

/** Occurs when a player is teamkilled.
 *
 * Data:
 *  - time - Date object of when the event occurred.
 *  - victim - PlayerObject of the damaged player.
 *  - damage - Amount of damage inflicted.
 *  - attacker - PlayerObject of the attacking player.
 *  - attackerPlayerController - PlayerController of the attacking player.
 *  - weapon - The classname of the weapon used.
 *  - teamkill - Whether the kill was a teamkill.
 *  - suicide - Was the kill a suicide.
 */
const LOG_PARSER_TEAMKILL = 'LOG_PARSER_TEAMKILL';

/** Occurs when a player is wounded.
 *
 * Data:
 *  - time - Date object of when the event occurred.
 *  - victim - PlayerObject of the damaged player.
 *  - damage - Amount of damage inflicted.
 *  - attacker - PlayerObject of the attacking player.
 *  - attackerPlayerController - PlayerController of the attacking player.
 *  - weapon - The classname of the weapon used.
 *  - teamkill - Whether the kill was a teamkill.
 *  - suicide - Was the kill a suicide.
 */
const LOG_PARSER_PLAYER_WOUNDED = 'LOG_PARSER_PLAYER_WOUNDED';

/** Occurs when the server tick rate is updated.
 *
 * Data:
 *  - time - Date object of when the event occurred.
 *  - tickRate - Tick rate of the server.
 */
const LOG_PARSER_SERVER_TICK_RATE = 'LOG_PARSER_SERVER_TICK_RATE';

export {
  LOG_PARSER_NEW_GAME,
  LOG_PARSER_PLAYER_CONNECTED,
  LOG_PARSER_PLAYER_DAMAGED,
  LOG_PARSER_PLAYER_DIED,
  LOG_PARSER_PLAYER_POSSESS,
  LOG_PARSER_PLAYER_REVIVED,
  LOG_PARSER_PLAYER_UNPOSSESS,
  LOG_PARSER_TEAMKILL,
  LOG_PARSER_PLAYER_WOUNDED,
  LOG_PARSER_SERVER_TICK_RATE
};
