import { CHAT_MESSAGE } from 'squad-server/events';

export default {
  name: 'chat-commands',
  description:
    'The `chat-command` plugin will automatically broadcast messages when a player types the corresponding command into any chat.',

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
        'See the default value as an example of how to configure commands. Type can either be `warn` or `broadcast`'
    }
  },

  init: async (server, options) => {
    server.on(CHAT_MESSAGE, (info) => {
      console.log(info);
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
