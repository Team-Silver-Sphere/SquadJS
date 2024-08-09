import Logger from 'core/logger';
import Rcon from 'core/rcon';
import { iterateIDs, capitalID, lowerID } from 'core/id-parser';

export default class SquadRcon extends Rcon {
  processChatPacket(decodedPacket) {
    const matchChat = decodedPacket.body.match(
      /\[(ChatAll|ChatTeam|ChatSquad|ChatAdmin)] \[Online IDs:([^\]]+)\] (.+?) : (.*)/
    );
    if (matchChat) {
      Logger.verbose('SquadRcon', 2, `Matched chat message: ${decodedPacket.body}`);

      const result = {
        raw: decodedPacket.body,
        chat: matchChat[1],
        name: matchChat[3],
        message: matchChat[4],
        time: new Date()
      };
      iterateIDs(matchChat[2]).forEach((platform, id) => {
        result[lowerID(platform)] = id;
      });
      this.emit('CHAT_MESSAGE', result);
      return;
    }

    const matchPossessedAdminCam = decodedPacket.body.match(
      /\[Online Ids:([^\]]+)\] (.+) has possessed admin camera\./
    );
    if (matchPossessedAdminCam) {
      Logger.verbose('SquadRcon', 2, `Matched admin camera possessed: ${decodedPacket.body}`);
      const result = {
        raw: decodedPacket.body,
        name: matchPossessedAdminCam[2],
        time: new Date()
      };
      iterateIDs(matchPossessedAdminCam[1]).forEach((platform, id) => {
        result[lowerID(platform)] = id;
      });
      this.emit('POSSESSED_ADMIN_CAMERA', result);
      return;
    }

    const matchUnpossessedAdminCam = decodedPacket.body.match(
      /\[Online IDs:([^\]]+)\] (.+) has unpossessed admin camera\./
    );
    if (matchUnpossessedAdminCam) {
      Logger.verbose('SquadRcon', 2, `Matched admin camera unpossessed: ${decodedPacket.body}`);
      const result = {
        raw: decodedPacket.body,
        name: matchUnpossessedAdminCam[2],
        time: new Date()
      };
      iterateIDs(matchUnpossessedAdminCam[1]).forEach((platform, id) => {
        result[lowerID(platform)] = id;
      });
      this.emit('UNPOSSESSED_ADMIN_CAMERA', result);
      return;
    }

    const matchWarn = decodedPacket.body.match(
      /Remote admin has warned player (.*)\. Message was "(.*)"/
    );
    if (matchWarn) {
      Logger.verbose('SquadRcon', 2, `Matched warn message: ${decodedPacket.body}`);

      this.emit('PLAYER_WARNED', {
        raw: decodedPacket.body,
        name: matchWarn[1],
        reason: matchWarn[2],
        time: new Date()
      });

      return;
    }

    const matchKick = decodedPacket.body.match(
      /Kicked player ([0-9]+)\. \[Online IDs=([^\]]+)\] (.*)/
    );
    if (matchKick) {
      Logger.verbose('SquadRcon', 2, `Matched kick message: ${decodedPacket.body}`);

      const result = {
        raw: decodedPacket.body,
        playerID: matchKick[1],
        name: matchKick[3],
        time: new Date()
      };
      iterateIDs(matchKick[2]).forEach((platform, id) => {
        result[lowerID(platform)] = id;
      });
      this.emit('PLAYER_KICKED', result);
      return;
    }

    const matchSqCreated = decodedPacket.body.match(
      /(?<playerName>.+) \(Online IDs:([^)]+)\) has created Squad (?<squadID>\d+) \(Squad Name: (?<squadName>.+)\) on (?<teamName>.+)/
    );
    if (matchSqCreated) {
      Logger.verbose('SquadRcon', 2, `Matched Squad Created: ${decodedPacket.body}`);
      const result = {
        time: new Date(),
        ...matchSqCreated.groups
      };
      iterateIDs(matchSqCreated[2]).forEach((platform, id) => {
        result['player' + capitalID(platform)] = id;
      });
      this.emit('SQUAD_CREATED', result);
      return;
    }

    const matchBan = decodedPacket.body.match(
      /Banned player ([0-9]+)\. \[Online IDs=([^\]]+)\] (.*) for interval (.*)/
    );
    if (matchBan) {
      Logger.verbose('SquadRcon', 2, `Matched ban message: ${decodedPacket.body}`);

      const result = {
        raw: decodedPacket.body,
        playerID: matchBan[1],
        name: matchBan[3],
        interval: matchBan[4],
        time: new Date()
      };
      iterateIDs(matchBan[2]).forEach((platform, id) => {
        result[lowerID(platform)] = id;
      });
      this.emit('PLAYER_BANNED', result);
    }
  }

  async getCurrentMap() {
    const response = await this.execute('ShowCurrentMap');
    const match = response.match(/^Current level is ([^,]*), layer is ([^,]*)/);
    return { level: match[1], layer: match[2] };
  }

  async getNextMap() {
    const response = await this.execute('ShowNextMap');
    const match = response.match(/^Next level is ([^,]*), layer is ([^,]*)/);
    return {
      level: match ? (match[1] !== '' ? match[1] : null) : null,
      layer: match ? (match[2] !== 'To be voted' ? match[2] : null) : null
    };
  }

  async getListPlayers() {
    const response = await this.execute('ListPlayers');

    const players = [];

    if (!response || response.length < 1) return players;

    for (const line of response.split('\n')) {
      const match = line.match(
        /^ID: (?<playerID>\d+) \| Online IDs:([^|]+)\| Name: (?<name>.+) \| Team ID: (?<teamID>\d|N\/A) \| Squad ID: (?<squadID>\d+|N\/A) \| Is Leader: (?<isLeader>True|False) \| Role: (?<role>.+)$/
      );
      if (!match) continue;

      const data = match.groups;
      data.playerID = +data.playerID;
      data.isLeader = data.isLeader === 'True';
      data.teamID = data.teamID !== 'N/A' ? +data.teamID : null;
      data.squadID = data.squadID !== 'N/A' ? +data.squadID : null;
      iterateIDs(match[2]).forEach((platform, id) => {
        data[lowerID(platform)] = id;
      });
      players.push(data);
    }
    return players;
  }

  async getSquads() {
    const responseSquad = await this.execute('ListSquads');

    const squads = [];
    let teamName;
    let teamID;

    if (!responseSquad || responseSquad.length < 1) return squads;

    for (const line of responseSquad.split('\n')) {
      const match = line.match(
        /ID: (?<squadID>\d+) \| Name: (?<squadName>.+) \| Size: (?<size>\d+) \| Locked: (?<locked>True|False) \| Creator Name: (?<creatorName>.+) \| Creator Online IDs:([^|]+)/
      );
      const matchSide = line.match(/Team ID: (\d) \((.+)\)/);
      if (matchSide) {
        teamID = +matchSide[1];
        teamName = matchSide[2];
      }
      if (!match) continue;
      match.groups.squadID = +match.groups.squadID;
      const squad = {
        ...match.groups,
        teamID: teamID,
        teamName: teamName
      };
      iterateIDs(match[6]).forEach((platform, id) => {
        squad['creator' + capitalID(platform)] = id;
      });
      squads.push(squad);
    }
    return squads;
  }

  async broadcast(message) {
    await this.execute(`AdminBroadcast ${message}`);
  }

  async setFogOfWar(mode) {
    await this.execute(`AdminSetFogOfWar ${mode}`);
  }

  async warn(anyID, message) {
    await this.execute(`AdminWarn "${anyID}" ${message}`);
  }

  // 0 = Perm | 1m = 1 minute | 1d = 1 Day | 1M = 1 Month | etc...
  async ban(anyID, banLength, message) {
    await this.execute(`AdminBan "${anyID}" ${banLength} ${message}`);
  }

  async switchTeam(anyID) {
    await this.execute(`AdminForceTeamChange "${anyID}"`);
  }
}
