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
const SERVER_LAYER_CHANGE = 'SERVER_LAYER_CHANGE';

/** Occurs when the player list is updated via RCON.
 *
 * Data:
 *  - Array of PlayerObjects
 */
const SERVER_PLAYERS_UPDATED = 'SERVER_PLAYERS_UPDATED';

/** Occurs when the layer info is updated via RCON.
 *
 * Data:
 *  - currentLayer - Current layer.
 *  - nextLayer - Next layer.
 */
const SERVER_LAYERS_UPDATED = 'SERVER_LAYERS_UPDATED';

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
const SERVER_A2S_UPDATED = 'SERVER_A2S_UPDATED';

export { SERVER_LAYER_CHANGE, SERVER_PLAYERS_UPDATED, SERVER_LAYERS_UPDATED, SERVER_A2S_UPDATED };
