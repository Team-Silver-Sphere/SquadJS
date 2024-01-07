import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export default {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Exit node process')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  async execute(interaction, server) {
    if (server !== null) {
      await server.unwatch();
    }
    await interaction.reply({
      content: `Shutting down discord bot${server !== null ? ' + SquadJS' : ''}...`,
      ephemeral: true
    });
    await delay(2000);
    await interaction.deleteReply();
    process.exit(0);
  }
};
