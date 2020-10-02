export default {
  name: 'discord-rcon',
  description:
    'The <code>discord-rcon</code> plugin allows a specified Discord channel to be used as a RCON console to run ' +
    'RCON commands.',

  defaultEnabled: true,
  optionsSpec: {
    discordClient: {
      required: true,
      description: 'The name of the Discord Connector to use.',
      default: 'discord'
    },
    channelID: {
      required: true,
      description: 'The ID of the channel you wish to turn into a RCON console.',
      default: '',
      example: '667741905228136459'
    },
    prependAdminNameInBroadcast: {
      required: false,
      description: "Prepend the admin's name when he makes an announcement.",
      default: false
    },
    permissions: {
        required: false,
        description:
          '<ul>' +
          '<li>Dictionary of roles and a list of the permissions they are allowed to use.' +
          '<li>If dictionary is empty (<code>{}</code>) permissions will be disabled</li>' +
          '<li>A list of avalable RCON commands can be found here <a>https://squad.gamepedia.com/Server_Administration#Admin_Console_Commands</a>' +
          '</ul>',
        default: {},
        example: {
            "discord_role_id":["list","of","allowed","commands"],
            "123456789123456789": ["AdminBroadcast","AdminForceTeamChange","AdminDemoteCommander"]
        }
    }
  },

  init: async (server, options) => {
    options.discordClient.on('message', async (message) => {
      if (message.author.bot || message.channel.id !== options.channelID) return;

      let command = message.content;

      function checkPermissions(command, permissions){
        for( const [role, commands] of Object.entries(permissions) ){
          if ( message.member._roles.includes(role.toString()) ){
            for( const allowed_command of commands ){
              if( command.toLowerCase() === allowed_command.toLowerCase() ) return true;
            }
          }
        }
        return false;
      }

      const command_prefix =  command.substring(0,command.indexOf(' '));
      if ( Object.entries(options.permissions).length > 0 && !checkPermissions(command_prefix, options.permissions) ){
        await message.channel.send(`${message.author} You do not have permissions for \`${command_prefix}\``);
        return;
      }

      if (options.prependAdminNameInBroadcast && command.toLowerCase().startsWith('adminbroadcast'))
        command = command.replace(
          /^AdminBroadcast /i,
          `AdminBroadcast ${message.member.displayName}: `
        );

      const response = await server.rcon.execute(command);

      const responseMessages = [''];

      for (const line of response.split('\n')) {
        if (responseMessages[responseMessages.length - 1].length + line.length > 1994) {
          responseMessages.push(line);
        } else {
          responseMessages[responseMessages.length - 1] = `${
            responseMessages[responseMessages.length - 1]
          }\n${line}`;
        }
      }

      for (const responseMessage of responseMessages) {
        await message.channel.send(`\`\`\`${responseMessage}\`\`\``);
      }
    });
  }
};
