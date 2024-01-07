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
 * @param {String | Array | Set | Map | Object} obj - Array, Set, Object or String
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
 * @param {String | Array | Set | Map | Object} obj - Array, object or string
 * @returns {boolean} Returns if statement true or false
 */
const isEmpty = (obj) => {
  return isNull(obj) || isBlank(obj);
};

export default class DiscordBot {
  constructor(connectorConfig) {
    this.log = this.log.bind(this);
    this.err = this.err.bind(this);

    if (typeof connectorConfig === 'string') {
      this.token = connectorConfig;
    } else if (typeof connectorConfig === 'object') {
      this.setConfig(connectorConfig, this);
    } else {
      throw new Error('{ connectorConfig } is invalid / must be a type of String or Object');
    }

    if (isEmpty(this.server)) {
      this.server = null;
    }

    const intents = [];
    if (Array.isArray(this.intents)) {
      for (const intent of this.intents) {
        intents.push(GatewayIntentBits[intent]);
      }
    } else {
      for (const intent of ['Guilds', 'GuildMessages', 'MessageContent']) {
        intents.push(GatewayIntentBits[intent]);
      }
    }
    this.client = new Client({ intents });

    this.commands = [];
    this.localCommands = [];
    this.globalCommands = [];
    this.client.commandIndex = new Collection();
    this.client.on(Events.Warn, this.log);

    this.loadEvents('./events');
    this.loadCommands(['./local-commands', './global-commands']);
  }

  setConfig(objA = {}, objB = {}) {
    objA = objA || {};
    objB = objB || {};
    for (const [key, value] of Object.entries(objA)) {
      if (!Object.hasOwn(objB, key)) {
        objB[key] = value;
      } else if (typeof value === 'object') {
        this.setConfig(value, objB[key]);
      }
    }
    return objB;
  }

  auth() {
    return new Promise((resolve, reject) => {
      this.log('Logging in...');
      this.client.once(Events.ClientReady, (c) => {
        this.log(`Logged in as ${c.user.tag}`);
        this.deloyCommands();
        resolve(c);
      });
      this.client.once(Events.Error, reject);
      this.client.login(this.token);
    });
  }

  static async getFiles(targetPath, cmdFilenames) {
    cmdFilenames = cmdFilenames || [];
    try {
      const dir = await fs.promises.opendir(path.join(__dirname, targetPath), { encoding: 'utf8' });
      for await (const dirent of dir) {
        if (dirent.isFile() && dirent.name.endsWith('.js')) {
          cmdFilenames.push(dirent.name);
        } else if (dirent.isDirectory()) {
          const childFiles = await fs.promises.opendir(path.join(dir, dirent.name), {
            encoding: 'utf8'
          });
          dir.push(...childFiles);
        }
      }
    } catch (ex) {
      if ('message' in ex) {
        if ('cause' in ex) {
          Logger.verbose('Err', 1, ex.cause);
        }
        Logger.verbose('Err', 1, ex.message);
        Logger.verbose('Err', 2, ex.stack);
      } else {
        Logger.verbose('Err', 1, ex);
      }
    }
    return cmdFilenames;
  }

  async loadEvents(root) {
    if (isEmpty(root)) {
      return;
    }
    const cmdFilenames = await DiscordBot.getFiles(root);
    if (isBlank(cmdFilenames)) {
      return;
    }
    for (const cmdFilename of cmdFilenames) {
      this.log(`Loading file ${cmdFilename}...`);
      const { default: cmdData } = await import(`${root}/${cmdFilename}`);
      if ('event' in cmdData && 'execute' in cmdData) {
        const evt = cmdData.once && cmdData?.once === true ? 'once' : 'on';
        if (cmdData.server && cmdData?.server === true) {
          this.client[evt](cmdData.event, (...args) => cmdData.execute(this.server, ...args));
        } else {
          this.client[evt](cmdData.event, (...args) => cmdData.execute(...args));
        }
      } else {
        this.err(`{ ${cmdFilename} } is missing a required "event" or "execute" property.`);
      }
    }
  }

  async loadCommands(folderPaths) {
    if (isEmpty(folderPaths)) {
      return;
    }
    for (const root of folderPaths) {
      const cmdFilenames = await DiscordBot.getFiles(root);
      if (isBlank(cmdFilenames)) continue;
      for (const cmdFilename of cmdFilenames) {
        this.log(`Loading command file ${cmdFilename}...`);
        const { default: cmdData } = await import(`${root}/${cmdFilename}`);
        if ('data' in cmdData && 'execute' in cmdData) {
          if (/global/.test(root) || cmdData.global) {
            this.globalCommands.push(cmdData.data.toJSON());
          } else {
            this.localCommands.push(cmdData.data.toJSON());
          }
          this.client.commandIndex.set(cmdData.data.name, cmdData);
        } else {
          this.err(`{ ${cmdFilename} } is missing a required "data" or "execute" property.`);
        }
      }
    }
  }

  async deloyCommands() {
    try {
      if (isEmpty(this.clientID)) {
        throw new Error('{ clientID } is missing / invalid - ' + this.clientID);
      }

      this.client.on(Events.InteractionCreate, async (interaction) => {
        const command = interaction.client.commandIndex.get(interaction.commandName);
        if (!command) {
          this.err(`No command matching ${interaction.commandName} was found.`);
          return;
        }
        try {
          if (interaction.isChatInputCommand()) {
            await command.execute(interaction, this.server);
          } else if (interaction.isAutocomplete()) {
            await command.autocomplete(interaction, this.server);
          }
        } catch (ex) {
          this.err(ex);
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

      const reset = new REST({ version: '10' }).setToken(this.token);

      let data = [];
      if (!isBlank(this.localCommands) && !isEmpty(this.guidID)) {
        this.log(`Started refreshing ${this.localCommands.length} application (/) commands.`);
        data = await reset
          .put(Routes.applicationGuildCommands(this.clientID, this.guidID), {
            body: this.localCommands
          })
          .catch((ex) => {
            this.err(`Failed to load Routes. Reason: ${ex.message}`, ex.stack);
          });
        this.log(`Successfully reloaded ${data.length} application (/) commands.`);
      }
      if (!isBlank(this.globalCommands)) {
        this.log(`Started refreshing ${this.globalCommands.length} application (/) commands.`);
        data = await reset
          .put(Routes.applicationCommands(this.clientID), { body: this.globalCommands })
          .catch((ex) => {
            this.err(`Failed to load Routes. Reason: ${ex.message}`, ex.stack);
          });
        this.log(`Successfully reloaded ${data.length} application (/) commands.`);
      }
    } catch (ex) {
      this.err(`Failed to load RESET. Reason: ${ex.message}`, ex.stack);
    }
  }

  log(...msg) {
    Logger.verbose('DiscordJS', 1, ...msg);
  }

  err(ex) {
    if ('message' in ex) {
      if ('cause' in ex) {
        Logger.verbose('Err', 1, ex.cause);
      }
      Logger.verbose('Err', 1, ex.message);
      Logger.verbose('Err', 2, ex.stack);
    } else {
      Logger.verbose('Err', 1, ex);
    }
  }
}
