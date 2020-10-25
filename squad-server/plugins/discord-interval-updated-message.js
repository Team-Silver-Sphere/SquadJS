import DataTypes from 'sequelize';
import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordIntervalUpdatedMessage extends DiscordBasePlugin {
  static get optionsSpecification() {
    return {
      ...super.optionsSpecification,
      subscribeMessage: {
        description: 'Trigger message to start the broadcast on the channel',
        default: '!start'
      },
      unsubscribeMessage: {
        description: 'Trigger message to stop the broadcast on this channel',
        default: '!stop'
      },
      interval: {
        description: 'Update interval in seconds',
        default: 300
      },
      storage: {
        description: 'Storrage connector name',
        connector: 'databaseClient',
        default: 'sqlite'
      }
    };
  }

  constructor(server, options) {
    super(server, options);

    this.subscribeMessage = options.subscribeMessage;
    this.unsubscribeMessage = options.unsubscribeMessage;
    this.interval = options.interval;
    this.storage = options.storage;

    this.discordClient.once('ready', async () => {
      await this.setupDatabase();
      this.setupMessageTriggers(server);
      this.setupUpdateInterval(server);
    });
  }

  async setupDatabase() {
    try {
      const tableName = this.constructor.name + '_DiscordIntervalUpdateMessage';
      this.DiscordBrodcastDestination = this.storage.define(tableName, {
        channelId: DataTypes.STRING,
        messageId: DataTypes.STRING
      });
      await this.storage.sync();
    } catch (e) {
      console.error(e);
    }
  }

  setupMessageTriggers(server) {
    this.discordClient.on('message', async (message) => {
      if (message.content === this.subscribeMessage) {
        await this.subscribeDiscordDesination(server, message.channel);
      } else if (message.content === this.unsubscribeMessage) {
        await this.unsubscribeDiscordDestination(message.channel.id);
      }
    });
  }

  setupUpdateInterval(server) {
    this.discordClient.setInterval(async () => {
      this.DiscordBrodcastDestination.findAll()
        .then((bordcastsArray) => {
          bordcastsArray.every(async (brodcast) => {
            try {
              const channel = await this.discordClient.channels.fetch(brodcast.channelId);
              const message = await channel.messages.fetch(brodcast.messageId);

              await message.edit(this.buildMessage(server));
            } catch (e) {
              if (e.httpStatus === 404) {
                await this.DiscordBrodcastDestination.destroy({ where: { id: brodcast.id } });
              } else {
                console.error(e);
              }
            }
          });
        })
        .catch((e) => console.error(e));
    }, this.interval * 1000);
  }

  async subscribeDiscordDesination(server, channel) {
    const messageId = await this.writeMessageToChannel(server, channel);
    const brodcast = this.DiscordBrodcastDestination.build({
      channelId: channel.id,
      messageId: messageId
    });
    await brodcast.save();
  }

  async writeMessageToChannel(server, channel) {
    const message = await channel.send(this.buildMessage(server));
    return message.id;
  }

  buildMessage(server) {
    return 'Override me !';
  }

  async unsubscribeDiscordDestination(channelId) {
    await this.DiscordBrodcastDestination.destroy({ where: { channelId: channelId } });
  }
}
