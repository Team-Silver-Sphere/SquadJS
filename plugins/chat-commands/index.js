import { CHAT_MESSAGE } from 'squad-server/events';

export default {
  name: 'chat-commands',
  description:
    'The <code>chat-command</code> plugin can be configured to make chat commands that broadcast or warn the caller ' +
    'with present messages.',

  defaultEnabled: true,
  optionsSpec: {
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
          command: '!squadjs',
          type: 'warn',
          response: 'This server is powered by SquadJS.',
          ignoreChats: []
        }
      ]
    }
  },

  init: async (server, options) => {
    server.on(CHAT_MESSAGE, (info) => {
      // loop through all possibilities
      for (const command of options.commands) {
        // check if message is a command
        if (!info.message.startsWith(command.command)) continue;
        // check if ignored channel
        if (command.ignoreChats.includes(info.chat)) continue;
        // React to command with either a broadcast or a warning
        if (command.type === 'broadcast') {
          server.rcon.broadcast(command.response);
        } else if (command.type === 'warn') {
          server.rcon.warn(info.steamID, command.response);
        }
      }
    });
  }
};
