import BasePlugin from './base-plugin.js';

export default class ChatCommands extends BasePlugin {
  static get description() {
    return (
      'The <code>ChatCommands</code> plugin can be configured to make chat commands that broadcast or warn the ' +
      'caller with present messages.'
    );
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      commands: {
        required: false,
        description:
          'An array of objects containing the following properties: ' +
          '<ul>' +
          '<li><code>command</code> - The command that initiates the message.</li>' +
          '<li><code>type</code> - Either <code>warn</code> or <code>broadcast</code>.</li>' +
          '<li><code>response</code> - The message to respond with.</li>' +
          '<li><code>ignoreChats</code> - A list of chats to ignore the commands in. Use this to limit it to admins.</li>' +
          '</ul>',
        default: [
          {
            command: 'squadjs',
            type: 'warn',
            response: 'This server is powered by SquadJS.',
            ignoreChats: []
          }
        ]
      }
    };
  }

  async mount() {
    for (const command of this.options.commands) {
      this.server.on(`CHAT_COMMAND:${command.command.toLowerCase()}`, async (data) => {
        if (command.ignoreChats.includes(data.chat)) return;

        if (command.type === 'broadcast') {
          await this.server.rcon.broadcast(command.response);
        } else if (command.type === 'warn') {
          await this.server.rcon.warn(data.player.steamID, command.response);
        }
      });
    }
  }
}
