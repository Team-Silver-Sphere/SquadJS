import { CHAT_MESSAGE } from 'squad-server/events';

export default {
  name: 'chat-commands',
  description:
    'The `chat-command` plugin can be configured to make chat commands that broadcast or warn the caller with present messages.',

  defaultEnabled: false,
  optionsSpec: {
    commands: {
      type: 'Array of command configs',
      required: false,
      default: [
        {
          command: '!squadjs',
          type: 'warn',
          response: 'This server is powered by SquadJS.',
          ignoreChats: []
        }
      ],
      description:
        'An array of objects containing the following properties: `command`, the command that initiates the message. `type`, either `warn` or `broadcast`. `response`, the message to respond with. `ignoreChats`, a list of chat to ignore for this command.'
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
