import { SlashCommandBuilder } from 'discord.js';

const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export default {
  data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
  async execute(interaction, server = null) {
    await interaction.reply({
      content: server === null ? 'Bot: Pong!\nSquad: Not connected' : 'Bot: Pong!\nSquad: Pong!',
      ephemeral: true
    });
    await delay(4000);
    await interaction.deleteReply();
  }
};
