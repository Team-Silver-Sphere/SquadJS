import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Collection, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import Logger from 'core/logger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Object is Null
 * @param {Object} obj - Object
 * @returns {boolean} Returns if statement true or false
 */
const isNull = (obj) => {
  return Object.is(obj, null) || Object.is(obj, undefined);
};

/**
 * Object is Blank
 * @param {(Object|Object[]|string)} obj - Array, Set, Object or String
 * @returns {boolean} Returns if statement true or false
 */
const isBlank = (obj) => {
  return (
    (typeof obj === 'string' && Object.is(obj.trim(), '')) ||
    (obj instanceof Set && Object.is(obj.size, 0)) ||
    (Array.isArray(obj) && Object.is(obj.length, 0)) ||
    (obj instanceof Object &&
      typeof obj.entries !== 'function' &&
      Object.is(Object.keys(obj).length, 0))
  );
};

/**
 * Object is Empty
 * @param {(Object|Object[]|string)} obj - Array, object or string
 * @returns {boolean} Returns if statement true or false
 */
const isEmpty = (obj) => {
  return isNull(obj) || isBlank(obj);
};

export default class DiscordBot {
  constructor(connectorConfig, server) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    this.token = connectorConfig;
    this.clientId = null;
    this.guildId = null;
    this.server = isNull(server) ? null : server;
    this.commands = [];
    this.localCommands = [];
    this.globalCommands = [];
    this.client.commandIndex = new Collection();

    if (typeof connectorConfig === 'object') {
      this.token = connectorConfig.token;
      this.clientId = connectorConfig.clientID;
      this.guildId = connectorConfig.guildID;
    }

    this.client.on(Events.Warn, (info) => {
      Logger.verbose('DiscordJS', 1, info);
    });
  }

  auth() {
    return new Promise((resolve, reject) => {
      Logger.verbose('DiscordJS', 1, 'Logging in...');
      this.client.once(Events.ClientReady, (c) => {
        Logger.verbose('DiscordJS', 1, `Logged in as ${c.user.tag}`);
        resolve(c);
      });
      this.client.on(Events.Error, reject);
      this.client.login(this.token);
    });
  }

  async localCmds() {
    if (isEmpty(this.clientId)) {
      return;
    }
    if (isEmpty(this.guildId)) {
      return;
    }

    const dir = await fs.promises.opendir(path.join(__dirname, './local-commands'));
    const cmdFilenames = [];
    for await (const dirent of dir) {
      if (!dirent.isFile()) continue;
      cmdFilenames.push(dirent.name);
    }
    if (isBlank(cmdFilenames)) {
      return;
    }
    for (const cmdFilename of cmdFilenames) {
      Logger.verbose('DiscordJS', 1, `Loading command file ${cmdFilename}...`);
      const { default: cmdData } = await import(`./local-commands/${cmdFilename}`);
      if ('data' in cmdData && 'execute' in cmdData) {
        this.localCommands.push(cmdData.data.toJSON());
        this.client.commandIndex.set(cmdData.data.name, cmdData);
      } else {
        Logger.verbose(
          'Err',
          1,
          `The command at "./local-commands/${cmdFilename}" is missing a required "data" or "execute" property.`
        );
      }
    }

    const rest = new REST().setToken(this.token);
    try {
      Logger.verbose(
        'DiscordJS',
        1,
        `Started refreshing ${this.localCommands.length} application (/) commands.`
      );

      const data = await rest
        .put(Routes.applicationGuildCommands(this.clientId, this.guildId), {
          body: this.localCommands
        })
        .catch((ex) => {
          Logger.verbose('Err', 1, `Failed to load Routes. Reason: ${ex.message}`, ex.stack);
        });

      Logger.verbose(
        'DiscordJS',
        1,
        `Successfully reloaded ${data.length} application (/) commands.`
      );
    } catch (ex) {
      Logger.verbose('Err', 1, `Failed to load RESET. Reason: ${ex.message}`, ex.stack);
    }
  }

  async globalCmds() {
    if (isEmpty(this.clientId)) {
      return;
    }

    const dir = await fs.promises.opendir(path.join(__dirname, './global-commands'));
    const cmdFilenames = [];
    for await (const dirent of dir) {
      if (!dirent.isFile()) continue;
      cmdFilenames.push(dirent.name);
    }
    if (isBlank(cmdFilenames)) {
      return;
    }
    for (const cmdFilename of cmdFilenames) {
      Logger.verbose('DiscordJS', 1, `Loading command file ${cmdFilename}...`);
      const { default: cmdData } = await import(`./global-commands/${cmdFilename}`);
      if ('data' in cmdData && 'execute' in cmdData) {
        this.globalCommands.push(cmdData.data.toJSON());
        this.client.commandIndex.set(cmdData.data.name, cmdData);
      } else {
        Logger.verbose(
          'Err',
          1,
          `The command at "./global-commands/${cmdFilename}" is missing a required "data" or "execute" property.`
        );
      }
    }

    const rest = new REST().setToken(this.token);
    try {
      Logger.verbose(
        'DiscordJS',
        1,
        `Started refreshing ${this.globalCommands.length} application (/) commands.`
      );

      const data = await rest
        .put(Routes.applicationCommands(this.clientId), { body: this.globalCommands })
        .catch((ex) => {
          Logger.verbose('Err', 1, `Failed to load Routes. Reason: ${ex.message}`, ex.stack);
        });

      Logger.verbose(
        'DiscordJS',
        1,
        `Successfully reloaded ${data.length} application (/) commands.`
      );
    } catch (ex) {
      Logger.verbose('Err', 1, `Failed to load RESET. Reason: ${ex.message}`, ex.stack);
    }
  }

  async getCommands() {
    this.client.on(Events.InteractionCreate, async (interaction) => {
      const command = interaction.client.commandIndex.get(interaction.commandName);
      if (!command) {
        Logger.verbose('Err', 1, `No command matching ${interaction.commandName} was found.`);
        return;
      }
      try {
        if (interaction.isChatInputCommand()) {
          await command.execute(interaction, this.server);
        } else if (interaction.isAutocomplete()) {
          await command.autocomplete(interaction, this.server);
        }
      } catch (ex) {
        Logger.verbose('Err', 1, `Failed to execute Interaction. Reason: ${ex.message}`, ex.stack);
        if (interaction.isChatInputCommand()) {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: 'There was an error while executing this command!',
              ephemeral: true
            });
          } else {
            await interaction.reply({
              content: 'There was an error while executing this command!',
              ephemeral: true
            });
          }
        } else if (interaction.isAutocomplete()) {
          await interaction.respond([
            { name: 'There was an error while executing this command!', value: '' }
          ]);
        }
      }
    });
    await this.localCmds();
    await this.globalCmds();
  }
}