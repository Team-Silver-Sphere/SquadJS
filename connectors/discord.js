import Discord from 'discord.js';
import { DISCORD_LOGIN_TOKEN } from 'core/config';

class DiscordConnector {
  constructor(options = {}) {
    this.client = new Discord.Client();
    this.clientLoginPromise = this.client.login(DISCORD_LOGIN_TOKEN);
  }

  async getClient() {
    await this.clientLoginPromise;
    return this.client;
  }
}

export default new DiscordConnector();
