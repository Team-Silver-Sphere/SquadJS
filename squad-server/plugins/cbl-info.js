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
      },
      minimalBanLengthToApply: {
        required: false,
        description: 'Bans of this length (in days) and longer would be applied. Set -1 to disable ban applying.',
        default: -1
      },
      banTagsToBeMonitored: {
        required: false,
        description: "List of ban tags to apply only bans with any of these. Set empty to disable filtering.",
        default: []
      },
      trustedBanIssuers: {
        required: false,
        description: "List of issuers' IDs to apply only bans from those. Set empty to disable filtering.",
        default: []
      },
      kickMessage: {
        required: false,
        description: "Message for applied bans to provide a kick with",
        default: "Banned on trusted server"
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
                    banList {
                      id
                      name
                      organisation {
                        id
                        name
                        discord
                      }
                    }
                    reason
                    created
                    expires
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
          `Player ${info.player.name} (Steam ID: ${info.player.steamID}) is not listed in the Community Ban List.`
        );
        return;
      }

      if (await this.applyBanIfNeeded(info, data)) return;

      if (data.steamUser.reputationPoints < this.options.threshold) {
        this.verbose(
          2,
          `Player ${info.player.name} (Steam ID: ${info.player.steamID}) has a reputation below the threshold.`
        );
        return;
      }

      await this.sendEmbed(info, data, "is a potentially harmful player!", '#ffc40b');
    } catch (err) {
      this.verbose(
        1,
        `Failed to fetch Community Ban List data for player ${info.name} (Steam ID: ${info.steamID}): `,
        err
      );
    }
  }

  async applyBanIfNeeded(info, data) {
    if (this.options.minimalBanLengthToApply === -1) return false;
    for (const edge of data.steamUser.activeBans.edges) {
      const node = edge.node;

      const earliestAllowedExpirationDate = new Date(node.created);
      earliestAllowedExpirationDate.setDate(earliestAllowedExpirationDate.getDate() + this.options.minimalBanLengthToApply);
      if (node.expires !== null && new Date(node.expires) < earliestAllowedExpirationDate) continue; // ban is too short to apply

      const banTags = node.reason.split(", ");
      let detectedTags = banTags.filter((tag) => this.options.banTagsToBeMonitored.includes(tag));
      if (this.options.banTagsToBeMonitored?.length > 0 &&
          detectedTags.length === 0
      ) continue; // ban is not marked with any allowed tag
      if (detectedTags.length === 0) detectedTags = ["Active ban"]; // to use it below

      if (this.options.trustedBanIssuers?.length > 0 &&
          !this.options.trustedBanIssuers.includes(node.banList.organisation.id)
      ) continue; // ban issuer is not trusted

      const kickDescription = `was kicked: ${detectedTags.join(', ')} on "${node.banList.organisation.name}" server`;

      void this.server.rcon.kick(info.player.steamID, this.options.kickMessage);
      this.verbose(
          1,
          `Player ${info.player.name} (Steam ID: ${info.player.steamID}) ${kickDescription}`
      );
      await this.sendEmbed(
          info,
          data,
          kickDescription,
          '#ff0000'
      );
      return true;
    }
    this.verbose(
        2,
        `Player ${info.player.name} (Steam ID: ${info.player.steamID}) doesn't have any bans to apply.`
    );
    return false;
  }

  async sendEmbed(info, data, description, color) {
    await this.sendDiscordMessage({
      embed: {
        title: `"${info.player.name}" ${description}`,
        author: {
          name: 'Community Ban List',
          url: 'https://communitybanlist.com/',
          icon_url: 'https://communitybanlist.com/static/media/cbl-logo.caf6584e.png'
        },
        thumbnail: {
          url: data.steamUser.avatarFull
        },
        description: `[${info.player.name}](https://communitybanlist.com/search/${info.player.steamID}) has ${data.steamUser.reputationPoints} reputation points on the Community Ban List and is therefore a potentially harmful player.`,
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
          },
          {
            name: 'Steam ID',
            value: `${info.player.steamID}`,
            inline: true
          }
        ],
        color: color,
        timestamp: info.time.toISOString(),
        footer: {
          text: 'Powered by SquadJS and the Community Ban List'
        }
      }
    });
  }
}
