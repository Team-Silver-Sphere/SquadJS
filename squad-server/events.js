/** Occurs when the player list is updated via RCON.
 *
 * Data:
 *  - Array of PlayerObjects
 */
const PLAYERS_UPDATED = 'PLAYERS_UPDATED';

/** Occurs when the layer info is updated via RCON.
 *
 * Data:
 *  - currentLayer - Current layer.
 *  - nextLayer - Next layer.
 */
const LAYERS_UPDATED = 'LAYERS_UPDATED';

/** Occurs when the server info is updated via A2S.
 *
 * Data:
 *  - serverName - Name of the server.
 *  - maxPlayers - Maximum number of players on the server.
 *  - publicSlots - Maximum number of public slots.
 *  - reserveSlots - Maximum number of reserved slots.
 *  - playerCount - Player count as per A2S query.
 *  - publicQueue - Length of the public queue.
 *  - reserveQueue - Length of the reserved queue.
 *  - matchTimeout - Time until match ends?
 *  - gameVersion - Game version.
 */
const A2S_INFO_UPDATED = 'A2S_INFO_UPDATED';

/** Occurs when a message is sent.
 *
 * Data:
 * - chat - Chat the message was sent to.
 * - steamID - Steam ID of the player.
 * - player - Name of the player.
 * - message - Message sent.
 * - time - Time message was sent, AKA now.
 */
const CHAT_MESSAGE = 'CHAT_MESSAGE';

/** Occurs when an admin broadcast is made.
 *
 * Data:
 *  - time - Date object of when the event occurred.
 *  - message - The message that was broadcasted.
 *  - from - Apparently who broadcasted it, but this is broken in Squad logs.
 */
const ADMIN_BROADCAST = 'ADMIN_BROADCAST';

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
const NEW_GAME = 'NEW_GAME';

/** Occurs when a player possess a new object.
 *
 * Data:
 *  - time - Date object of when the event occurred.
 *  - player - PlayerObject of the admin.
 *  - possessClassname - Classname of the object.
 */
const PLAYER_POSSESS = 'PLAYER_POSSESS';

/** Occurs when a player unpossess an object.
 *
 * Data:
 *  - time - Date object of when the event occurred.
 *  - player - PlayerObject of the admin.
 *  - switchPossess - True if switching a possess.
 */
const PLAYER_UNPOSSESS = 'PLAYER_UNPOSSESS';

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
const LAYER_CHANGE = 'LAYER_CHANGE';

/** Occurs when a new player connects.
 *
 * Data:
 *  - time - Date object of when the event occurred.
 *  - player - PlayerObject of the player.
 */
const PLAYER_CONNECTED = 'PLAYER_CONNECTED';

/** Occurs when a player is damaged.
 *
 * Data:
 *  - time - Date object of when the event occurred.
 *  - victim - PlayerObject of the damaged player.
 *  - damage - Amount of damage inflicted.
 *  - attacker - PlayerObject of the attacking player.
 *  - weapon - The classname of the weapon used.
 */
const PLAYER_DAMAGED = 'PLAYER_DAMAGED';

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
const PLAYER_WOUNDED = 'PLAYER_WOUNDED';

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
const TEAMKILL = 'TEAMKILL';

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
const PLAYER_DIED = 'PLAYER_DIED';

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
const PLAYER_REVIVED = 'PLAYER_REVIVED';

/** Occurs when the server tick rate is updated.
 *
 * Data:
 *  - time - Date object of when the event occurred.
 *  - tickRate - Tick rate of the server.
 */
const TICK_RATE = 'TICK_RATE';

/** Occurs when an RCON error occurs.
 *
 * Data:
 * - ErrorObject
 */
const RCON_ERROR = 'RCON_ERROR';

export {
  PLAYERS_UPDATED,
  LAYERS_UPDATED,
  A2S_INFO_UPDATED,
  ADMIN_BROADCAST,
  CHAT_MESSAGE,
  NEW_GAME,
  LAYER_CHANGE,
  PLAYER_CONNECTED,
  PLAYER_POSSESS,
  PLAYER_UNPOSSESS,
  PLAYER_DAMAGED,
  TEAMKILL,
  PLAYER_WOUNDED,
  PLAYER_DIED,
  PLAYER_REVIVED,
  TICK_RATE,
  RCON_ERROR
};
