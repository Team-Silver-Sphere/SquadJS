import GraphQLRequest from 'graphql-request';

import DiscordBasePlugin from './discord-base-plugin.js';

const { request, gql } = GraphQLRequest;

export default class CBLInfo extends DiscordBasePlugin {
  static get description() {
    return (
      'The <code>CBLInfo</code> plugin alerts admins when a harmful player is detected joining their server based ' +
      'on data from the <a href="https://communitybanlist.com/">Community Ban List</a>.'
    );
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelIDs: {
        required: true,
        description: 'The ID of the channel to alert admins through.',
        default: [],
        example: [
          {
            label: 'CBLInfo',
            channelID: '667741905228136459'
          }
        ]
      },
      embedInfo: {
        required: false,
        description: 'Server info for embed messages.',
        default: {
          clan: '',
          iconURL: 'https://communitybanlist.com/static/media/cbl-logo.caf6584e.png',
          url: 'https://communitybanlist.com/'
        }
      },
      threshold: {
        required: false,
        description:
          'Admins will be alerted when a player has this or more reputation points. For more information on ' +
          'reputation points, see the ' +
          '<a href="https://communitybanlist.com/faq">Community Ban List\'s FAQ</a>',
        default: 6
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onPlayerConnected = this.onPlayerConnected.bind(this);
  }

  async mount() {
    this.server.on('PLAYER_CONNECTED', this.onPlayerConnected);
  }

  async unmount() {
    this.server.removeEventListener('PLAYER_CONNECTED', this.onPlayerConnected);
  }

  async onPlayerConnected(info) {
    try {
      const steamID = this.isValid(info, '<steamID>');
      if (!steamID) {
        this.err('Invalid SteamID', info);
        return;
      }
      const data = await request(
        'https://communitybanlist.com/graphql',
        gql`
          query Search($id: String!) {
            steamUser(id: $id) {
              id
              name
              avatarFull
              reputationPoints
              riskRating
              reputationRank
              lastRefreshedInfo
              lastRefreshedReputationPoints
              lastRefreshedReputationRank
              activeBans: bans(orderBy: "created", orderDirection: DESC, expired: false) {
                edges {
                  cursor
                  node {
                    id
                  }
                }
              }
              expiredBans: bans(orderBy: "created", orderDirection: DESC, expired: true) {
                edges {
                  cursor
                  node {
                    id
                  }
                }
              }
            }
          }
        `,
        { id: steamID }
      );

      if (!data.steamUser) {
        this.verbose(
          2,
          `Player ${info.player.name} (Steam ID: ${steamID}) is not listed in the Community Ban List.`
        );
        return;
      }

      if (data.steamUser.reputationPoints < this.options.threshold) {
        this.verbose(
          2,
          `Player ${info.player.name} (Steam ID: ${steamID}) has a reputation below the threshold.`
        );
        return;
      }

      const embed = this.buildEmbed('#ffc40b', null, 'Community Ban List')
        .setTitle(`${info.player.name} is a potentially harmful player!`)
        .setDescription(
          `[${info.player.name}](https://communitybanlist.com/search/${steamID}) has ${data.steamUser.reputationPoints} reputation points on the Community Ban List and is therefore a potentially harmful player.`
        )
        .setThumbnail(data.steamUser.avatarFull)
        .addFields(
          {
            name: 'Reputation Points',
            value: `${data.steamUser.reputationPoints} (${
              data.steamUser.reputationPointsMonthChange || 0
            } from this month)`,
            inline: true
          },
          {
            name: 'Risk Rating',
            value: `${data.steamUser.riskRating} / 10`,
            inline: true
          },
          {
            name: 'Reputation Rank',
            value: `#${data.steamUser.reputationRank}`,
            inline: true
          },
          {
            name: 'Active Bans',
            value: `${data.steamUser.activeBans.edges.length}`,
            inline: true
          },
          {
            name: 'Expired Bans',
            value: `${data.steamUser.expiredBans.edges.length}`,
            inline: true
          }
        )
        .setFooter({ text: 'Powered by SquadJS and the Community Ban List', iconURL: null });
      if (this.channels.size === 1) {
        await this.sendDiscordMessage(this.objEmbed(embed));
      } else {
        const labels = this.options.channelIDs.map((channel) => channel.label);
        await this.sendDiscordMessage(this.objEmbed(embed), labels);
      }
    } catch (err) {
      this.verbose(
        1,
        `Failed to fetch Community Ban List data for player ${info.name} (Steam ID: ${info.steamID}): `,
        err
      );
    }
  }
}
