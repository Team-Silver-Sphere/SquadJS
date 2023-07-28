import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rcon')
    .setDescription('RCON squad server')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('raw')
        .setDescription('Input raw RCON command')
        .addStringOption((option) =>
          option
            .setName('input')
            .setDescription('RCON command')
            .setMaxLength(2000)
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option.setName('hidden').setDescription('Hide the message from other users')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('ls')
        .setDescription('List of RCON commands')
        .addStringOption((option) =>
          option
            .setName('cmd')
            .setDescription('RCON command')
            .setAutocomplete(true)
            .setMaxLength(2000)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('params')
            .setDescription('RCON command paramters')
            .setAutocomplete(true)
            .setMaxLength(2000)
        )
        .addBooleanOption((option) =>
          option.setName('hidden').setDescription('Hide the message from other users')
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),
  async execute(interaction, server = null) {
    if (server === null) {
      await interaction.reply({ content: 'Squad server not connected', ephemeral: true });
      return;
    }
    const cmd = interaction.options.getString('cmd');
    const params = interaction.options.getString('params');
    let resp = {};
    if (!(cmd === null && params === null)) {
      if (cmd === 'getSquads' || cmd === 'getListPlayers') {
        resp = await server.rcon[cmd]();
      } else if (cmd === 'AdminBroadcast') {
        await server.rcon.broadcast(params);
        resp = {
          name: `Sent Broadcast: ${params}`,
          value: `Sent Broadcast: ${params}`
        };
      } else if (/admin(kick)/gi.test(cmd)) {
        server.rcon.kick(params);
        resp = {
          name: 'Player Kicked',
          value: 'Player Kicked'
        };
      } else if (/admin(ban)/gi.test(cmd)) {
        resp = {
          name: 'Player Banned',
          value: 'Player Banned'
        };
      } else if (/layer/gi.test(cmd)) {
        server.rcon.execute(`${cmd} ${params}`);
        resp = {
          name: 'Changed/set Layer',
          value: 'Changed/set Layer'
        };
      }
    }

    await interaction.reply({
      content: `\`\`\`json\n${JSON.stringify(resp, null, ' ')}\`\`\``,
      ephemeral: true
    });
  },
  async autocomplete(interaction, server) {
    if (server === null) {
      await interaction.respond([{ name: 'Squad server not connected', value: '' }]);
      return;
    }
    const focusedOption = interaction.options.getFocused(true);
    const cmd = interaction.options.getString('cmd');
    const params = interaction.options.getString('params');
    let choices = [
      'AdminBroadcast',
      'ChatToAdmin',
      'AdminKick',
      'AdminBan',
      'AdminSetNextLayer',
      'AdminChangeLayer',
      'getSquads',
      'getListPlayers'
    ];
    if (cmd === null || params === null) {
      const filtered = choices.filter((choice) => choice.startsWith(focusedOption.value));
      await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })));
      return;
    } else if (cmd !== null) {
      if (cmd === 'getSquads' || cmd === 'getListPlayers') {
        choices = ['Parameters not needed!'];
      } else if (cmd === 'AdminBroadcast') {
        choices = ['<Message>'];
      } else if (/admin(kick)/gi.test(cmd)) {
        choices = ['<NameOrSteamId> <KickReason>'];
      } else if (/admin(ban)/gi.test(cmd)) {
        choices = ['<NameOrSteamId> <BanLength> <BanReason>'];
      } else if (/layer/gi.test(cmd)) {
        choices = ['<LayerName>'];
      }
    }
    await interaction.respond(choices.map((choice) => ({ name: choice, value: choice })));
  }
};
