import DiscordBasePlugin from './discord-base-plugin.js';

const padTo2Digits = (num) => num.toString().padStart(2, '0');
const millisToMinutesAndSeconds = (milliseconds) => {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.round((milliseconds % 60000) / 1000);
  return seconds === 60 ? `${minutes + 1}:00` : `${minutes}:${padTo2Digits(seconds)}`;
};

export default class DiscordAdminCamLogs extends DiscordBasePlugin {
  static get description() {
    return 'The <code>DiscordAdminCamLogs</code> plugin will log in game admin camera usage to a Discord channel.';
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelIDs: {
        required: true,
        description:
          'The ID of the channel to log admin camera usage to. ' +
          'Specify one channel ID will send all usage to that channel.',
        default: [],
        example: [
          {
            label: 'admin-camera-entry',
            channelID: '667741905228136459'
          },
          {
            label: 'admin-camera-exit',
            channelID: '667741905228131111'
          }
        ]
      },
      colors: {
        required: false,
        description: 'Colors for embed messages.',
        default: {
          entry: 2202966,
          exit: 15416641
        }
      },
      embedInfo: {
        required: false,
        description: 'Server info for embed messages.',
        default: {
          clan: 'SquadJS ',
          name: 'Admin Camera',
          iconURL: null,
          url: null
        }
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.hasCamera = this.hasCamera.bind(this);
  }

  async mount() {
    this.server.on('POSSESSED_ADMIN_CAMERA', this.hasCamera);
    this.server.on('UNPOSSESSED_ADMIN_CAMERA', this.hasCamera);
  }

  async unmount() {
    this.server.removeEventListener('POSSESSED_ADMIN_CAMERA', this.hasCamera);
    this.server.removeEventListener('UNPOSSESSED_ADMIN_CAMERA', this.hasCamera);
  }

  async hasCamera(info) {
    const { entry, exit } = this.options.colors;
    const embed = this.buildEmbed(this.isEmpty(info.duration) ? entry : exit, null, 'Admin Camera')
      .setDescription(
        `${this.validName(info)} has ${
          this.isEmpty(info.duration) ? '**Entered**' : '**Left**'
        } Admin Camera.`
      )
      .setColor(this.options.color)
      .addFields(
        {
          name: 'Admin',
          value: this.validSteamID(info),
          inline: false
        },
        {
          name: 'Squad Data',
          value: this.validSquad(info),
          inline: true
        },
        {
          name: 'Team Data',
          value: this.validTeam(info),
          inline: true
        }
      );
    if (!this.isEmpty(info.duration)) {
      embed.addFields({
        name: 'Time in Admin Camera',
        value: `${millisToMinutesAndSeconds(info.duration)} min`
      });
    }
    if (this.channels.size === 1) {
      const labels = this.options.channelIDs.map((channel) => channel.label);
      await this.sendDiscordMessage(this.objEmbed(embed), labels);
    } else {
      const label = this.isEmpty(info.duration) ? 'admin-camera-entry' : 'admin-camera-exit';
      await this.sendDiscordMessage(this.objEmbed(embed), label);
    }
  }
}
