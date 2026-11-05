// improved CBL info to show SteamID and EOS ID
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
    this.server.removeListener('PLAYER_CONNECTED', this.onPlayerConnected);
  }

  async onPlayerConnected(info) {
    try {
      // Players from the Epic Games Store have an EOS ID but no Steam ID.
      const { steamID, eosID } = info.player;
      const id = steamID || eosID;

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
                  node {
                    id
                  }
                }
              }
              expiredBans: bans(orderBy: "created", orderDirection: DESC, expired: true) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        `,
        { id }
      );

      if (!data.steamUser) {
        this.verbose(
          2,
          `Player ${info.player.name} (ID: ${id}) is not listed in the Community Ban List.`
        );
        return;
      }

      if (data.steamUser.reputationPoints < this.options.threshold) {
        this.verbose(
          2,
          `Player ${info.player.name} (ID: ${id}) has a reputation below the threshold.`
        );
        return;
      }

      await this.sendDiscordMessage({
        embed: {
          title: `${info.player.name} is a potentially harmful player!`,
          author: {
            name: 'Community Ban List',
            url: 'https://communitybanlist.com/',
            icon_url: 'https://communitybanlist.com/static/media/cbl-logo.caf6584e.png'
          },
          // A player may have no avatar, such as one with no Steam profile.
          thumbnail: data.steamUser.avatarFull ? { url: data.steamUser.avatarFull } : undefined,
          description: `[${info.player.name}](https://communitybanlist.com/search/${id}) has ${data.steamUser.reputationPoints} reputation points on the Community Ban List and is therefore a potentially harmful player.`,
          fields: [
            {
              name: 'Steam ID',
              value: steamID
                ? `[${steamID}](https://steamcommunity.com/profiles/${steamID})`
                : 'Unknown',
              inline: true
            },
            {
              name: 'EOS ID',
              value: eosID || 'Unknown',
              inline: true
            },
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
            text: 'Powered by SquadJS and the Community Ban List'
          }
        }
      });
    } catch (err) {
      this.verbose(
        1,
        `Failed to fetch Community Ban List data for player ${info.player?.name} (ID: ${
          info.player?.steamID || info.player?.eosID
        }):`,
        err
      );
    }
  }
}
