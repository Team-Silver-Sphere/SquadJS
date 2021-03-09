import GraphQLRequest from 'graphql-request';

import DiscordBasePlugin from './discord-base-plugin.js';

const { request, gql } = GraphQLRequest;

export default class SCBLInfo extends DiscordBasePlugin {
  static get description() {
    return (
      'The <code>SCBLInfo</code> plugin alerts admins when a harmful player is detected joining their server based ' +
      'on data from the <a href="https://squad-community-ban-list.com/">Squad Community Ban List</a>.'
    );
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelID: {
        required: true,
        description: 'The ID of the channel to alert admins through.',
        default: '',
        example: '667741905228136459'
      },
      threshold: {
        required: false,
        description:
          'Admins will be alerted when a player has this or more reputation points. For more information on ' +
          'reputation points, see the ' +
          '<a href="https://squad-community-ban-list.com/faq">Squad Community Ban List\'s FAQ</a>',
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
      const data = await request(
        'https://squad-community-ban-list.com/graphql',
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
        { id: info.player.steamID }
      );

      if (!data.steamUser) {
        this.verbose(
          2,
          `Player ${info.name} (Steam ID: ${info.steamID}) is not listed in the Squad Community Ban List.`
        );
        return;
      }

      if (data.steamUser.reputationPoints < this.options.threshold) {
        this.verbose(
          2,
          `Player ${info.name} (Steam ID: ${info.steamID}) has a reputation below the threshold.`
        );
        return;
      }

      await this.sendDiscordMessage({
        embed: {
          title: `${info.player.name} is a potentially harmful player!`,
          author: {
            name: 'Squad Community Ban List',
            url: 'https://squad-community-ban-list.com/',
            icon_url:
              'https://cdn.jsdelivr.net/gh/Thomas-Smyth/Squad-Community-Ban-List@master/client/src/assets/img/brand/scbl-logo-square.png'
          },
          thumbnail: {
            url: data.steamUser.avatarFull
          },
          description: `[${info.player.name}](https://squad-community-ban-list.com/search/${info.player.steamID}) has ${data.steamUser.reputationPoints} reputation points on the Squad Community Ban List and is therefore a potentially harmful player.`,
          fields: [
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
          ],
          color: '#ffc40b',
          timestamp: info.time.toISOString(),
          footer: {
            text: 'Powered by SquadJS and the Squad Community Ban List'
          }
        }
      });
    } catch (err) {
      this.verbose(
        1,
        `Failed to fetch Squad Community Ban List data for player ${info.name} (Steam ID: ${info.steamID}): `,
        err
      );
    }
  }
}
