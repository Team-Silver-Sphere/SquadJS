/** Occurs when an RCON error occurs.
 *
 * Data:
 * - ErrorObject
 */
const RCON_ERROR = 'RCON_ERROR';

/** Occurs when a message is sent.
 *
 * Data:
 * - chat - Chat the message was sent to.
 * - steamID - Steam ID of the player.
 * - player - Name of the player.
 * - message - Message sent.
 * - time - Time message was sent, AKA now.
 */
const RCON_CHAT_MESSAGE = 'RCON_CHAT_MESSAGE';

export { RCON_ERROR, RCON_CHAT_MESSAGE };
