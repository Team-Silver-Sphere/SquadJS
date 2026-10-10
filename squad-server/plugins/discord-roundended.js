
import fs from 'fs';
import path from 'path';
import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordRoundEnded extends DiscordBasePlugin {
  static get description() {
    return 'Sends round results with ticket-difference colors and alerts admins after consecutive high-difference rounds.';
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelID: {
        required: true,
        description: 'The Discord channel for round-end messages and alerts.',
        default: '',
        example: '667741905228136459'
      },
      guildID: {
        required: false,
        description: 'The Discord guild ID used for admin alerts.',
        default: '531243268256694313',
        example: '123456789012345678'
      },
      color: {
        required: false,
        description: 'The embed color for draws.',
        default: 3447003
      },
      maxTicketDiff: {
        required: false,
        description: 'Ticket difference at which the non-Invasion color reaches red.',
        default: 210
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.connectors = connectors;
    this.onRoundEnd = this.onRoundEnd.bind(this);

    this.diffHistoryFile = path.join(
      process.cwd(),
      'data',
      'ticketDiffHistory.json'
    );

    this.discordMapFile = path.join(
      process.cwd(),
      'data',
      'admin_discord_IDs.json'
    );

    this.ensureDataFile();
  }

  async mount() {
    this.server.on('ROUND_ENDED', this.onRoundEnd);
  }

  async unmount() {
    this.server.removeListener('ROUND_ENDED', this.onRoundEnd);
  }

  ensureDataFile() {
    const directory = path.dirname(this.diffHistoryFile);

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    if (!fs.existsSync(this.diffHistoryFile)) {
      fs.writeFileSync(this.diffHistoryFile, '[]', 'utf8');
    }
  }

  readDiffHistory() {
    try {
      const history = JSON.parse(
        fs.readFileSync(this.diffHistoryFile, 'utf8')
      );

      return Array.isArray(history) ? history : [];
    } catch (error) {
      this.verbose(
        1,
        '[RoundEnded] Could not read ticket history:',
        error.message
      );

      return [];
    }
  }

  writeDiffHistory(history) {
    try {
      fs.writeFileSync(
        this.diffHistoryFile,
        JSON.stringify(history.slice(-2)),
        'utf8'
      );
    } catch (error) {
      this.verbose(
        1,
        '[RoundEnded] Could not save ticket history:',
        error.message
      );
    }
  }

  loadDiscordMap() {
    try {
      const data = JSON.parse(
        fs.readFileSync(this.discordMapFile, 'utf8')
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      this.verbose(
        1,
        '[RoundEnded] Could not load Discord ID mappings:',
        error.message
      );

      return [];
    }
  }

  findDiscordId(map, steamid64) {
    const entry = map.find(
      item => String(item.steamid64) === String(steamid64)
    );

    return entry?.discord_user_id
      ? String(entry.discord_user_id)
      : null;
  }

  getColorByTicketDifference(diff) {
    const minDiff = 70;
    const maxDiff = Math.max(
      minDiff + 1,
      Number(this.options.maxTicketDiff) || 210
    );

    const ratio = Math.max(
      0,
      Math.min(1, (diff - minDiff) / (maxDiff - minDiff))
    );

    // Green -> Yellow -> Red.
    const stops = [
      { position: 0, color: [7, 240, 42] },
      { position: 0.5, color: [216, 240, 7] },
      { position: 1, color: [240, 7, 7] }
    ];

    const scaledPosition = ratio * 2;
    const left = stops[Math.floor(scaledPosition)];
    const right = stops[Math.min(2, Math.floor(scaledPosition) + 1)];
    const segmentRatio = scaledPosition - Math.floor(scaledPosition);

    const channels = left.color.map((value, index) =>
      Math.round(
        value + (right.color[index] - value) * segmentRatio
      )
    );

    return (channels[0] << 16) | (channels[1] << 8) | channels[2];
  }

  async pingIfHighDiff(ticketDiff, isInvasion) {
    // Invasion rounds do not trigger or count toward these alerts.
    if (isInvasion) {
      return;
    }

    const history = this.readDiffHistory();
    history.push(ticketDiff);

    const lastTwo = history.slice(-2);
    this.writeDiffHistory(lastTwo);

    if (
      lastTwo.length !== 2 ||
      lastTwo.some(diff => typeof diff !== 'number' || diff < 200)
    ) {
      return;
    }

    // Reset before attempting Discord operations so errors or missing
    // configuration do not cause the same pair to alert repeatedly.
    this.writeDiffHistory([]);

    try {
      const discordClient = this.connectors?.discord;

      if (!discordClient) {
        this.verbose(1, '[RoundEnded] Discord connector is unavailable.');
        return;
      }

      const guild = await discordClient.guilds.fetch(this.options.guildID);
      await guild.members.fetch();

      const roleIds = [
        '1305722748785397790',
        '1363013276635758592'
      ];

      const excludeIds = [
        '1310663416876236932',
        '955958918490775602',
        '1199180195194736670',
        '1376499363538272286'
      ];

      const eligibleMembers = guild.members.cache.filter(member =>
        roleIds.some(roleId => member.roles.cache.has(roleId)) &&
        member.presence &&
        ['online', 'idle'].includes(member.presence.status) &&
        !excludeIds.includes(member.id)
      );

      const discordMap = this.loadDiscordMap();

      const adminEosIds = this.server.getAdminsWithPermission(
        'cameraman',
        'eosID'
      ) || [];

      const adminPlayers = this.server.players.filter(player =>
        adminEosIds.includes(player.eosID)
      );

      const inServerNames = [];
      const inServerDiscordIds = [];

      for (const player of adminPlayers) {
        const displayName =
          player?.name ||
          player?.username ||
          player?.playerName ||
          player?.PlayerName ||
          player?.steamName ||
          String(player?.steamID || '');

        if (displayName) {
          inServerNames.push(displayName);
        }

        const discordId = this.findDiscordId(
          discordMap,
          player.steamID
        );

        if (discordId) {
          inServerDiscordIds.push(discordId);
        }
      }

      const uniqueNames = [...new Set(inServerNames)];
      const uniqueDiscordIds = [...new Set(inServerDiscordIds)];

      const onlineInServer = eligibleMembers.filter(member =>
        uniqueDiscordIds.includes(member.id)
      );

      const onlineNotInServer = eligibleMembers.filter(member =>
        !uniqueDiscordIds.includes(member.id)
      );

      const lines = [
        '⚠️ **High ticket difference detected in two consecutive rounds!**',
        '',
        uniqueNames.length
          ? `**In-game admins:**\n${uniqueNames.map(name => `• ${name}`).join('\n')}`
          : '**In-game admins:** None identified',
        '',
        onlineInServer.length
          ? `**Online/idle admins in-game:** ${onlineInServer.map(member => `<@${member.id}>`).join(' ')}`
          : '**Online/idle admins in-game:** None identified',
        onlineNotInServer.length
          ? `**Other online/idle admins:** ${onlineNotInServer.map(member => `<@${member.id}>`).join(' ')}`
          : '**Other online/idle admins:** None',
        '',
        'Please attempt to balance the teams if available.',
        `Last two ticket differences: ${lastTwo.join(', ')}`
      ];

      const channel = await discordClient.channels.fetch(
        this.options.channelID
      );

      if (channel?.isTextBased()) {
        await channel.send({
          content: lines.join('\n'),
          allowedMentions: {
            users: onlineNotInServer.map(member => member.id)
          }
        });
      }
    } catch (error) {
      this.verbose(
        1,
        '[RoundEnded] Failed to send high-ticket-difference alert:',
        error.message || error
      );
    }
  }

  async onRoundEnd(info) {
    if (!info.winner || !info.loser) {
      await this.sendDiscordMessage({
        embed: {
          title: 'Round Ended',
          description: 'This match ended in a draw.',
          color: this.options.color,
          timestamp: info.time?.toISOString()
        }
      });

      return;
    }

    const ticketDiff = info.winner.tickets - info.loser.tickets;
    const isInvasion = String(info.winner.layer || '').includes('Invasion');

    await this.pingIfHighDiff(ticketDiff, isInvasion);

    const nextLayer =
      this.server.nextLayer?.name ||
      (this.server.nextLayerToBeVoted ? 'To be voted' : 'Unknown');

    const playerCount = this.server.a2sPlayerCount ?? 'Unknown';

    await this.sendDiscordMessage({
      embed: {
        title: `${info.winner.layer} - Round Ended`,
        description: `Players: ${playerCount}\nNext Layer: ${nextLayer}`,
        color: this.getColorByTicketDifference(ticketDiff),
        fields: [
          {
            name: `Team ${info.winner.team} Won`,
            value: `__${info.winner.faction}__\n${info.winner.subfaction}\nWon with ${info.winner.tickets} tickets.`,
            inline: true
          },
          {
            name: `Team ${info.loser.team} Lost`,
            value: `__${info.loser.faction}__\n${info.loser.subfaction}\nLost with ${info.loser.tickets} tickets.`,
            inline: true
          },
          {
            name: 'Ticket Difference',
            value: String(ticketDiff)
          }
        ],
        timestamp: info.time?.toISOString()
      }
    });
  }
}