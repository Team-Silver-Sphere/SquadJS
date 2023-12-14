import Logger from 'core/logger';
import Rcon from 'core/rcon';

export default class SquadRcon extends Rcon {
  processChatPacket(decodedPacket) {
    const matchChat = decodedPacket.body.match(
      /\[(ChatAll|ChatTeam|ChatSquad|ChatAdmin)] \[Online IDs:EOS: ([0-9a-f]{32}) steam: (\d{17})\] (.+?) : (.*)/
    );
    if (matchChat) {
      Logger.verbose('SquadRcon', 2, `Matched chat message: ${decodedPacket.body}`);

      this.emit('CHAT_MESSAGE', {
        raw: decodedPacket.body,
        chat: matchChat[1],
        eosID: matchChat[2],
        steamID: matchChat[3],
        name: matchChat[4],
        message: matchChat[5],
        time: new Date()
      });

      return;
    }

    const matchPossessedAdminCam = decodedPacket.body.match(
      /\[Online Ids:EOS: ([0-9a-f]{32}) steam: (\d{17})\] (.+) has possessed admin camera\./
    );
    if (matchPossessedAdminCam) {
      Logger.verbose('SquadRcon', 2, `Matched admin camera possessed: ${decodedPacket.body}`);
      this.emit('POSSESSED_ADMIN_CAMERA', {
        raw: decodedPacket.body,
        steamID: matchPossessedAdminCam[2],
        name: matchPossessedAdminCam[3],
        time: new Date()
      });

      return;
    }

    const matchUnpossessedAdminCam = decodedPacket.body.match(
      /\[Online IDs:EOS: ([0-9a-f]{32}) steam: (\d{17})\] (.+) has unpossessed admin camera\./
    );
    if (matchUnpossessedAdminCam) {
      Logger.verbose('SquadRcon', 2, `Matched admin camera possessed: ${decodedPacket.body}`);
      this.emit('UNPOSSESSED_ADMIN_CAMERA', {
        raw: decodedPacket.body,
        steamID: matchUnpossessedAdminCam[2],
        name: matchUnpossessedAdminCam[3],
        time: new Date()
      });

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
      /Kicked player ([0-9]+)\. \[Online IDs= EOS: ([0-9a-f]{32}) steam: (\d{17})] (.*)/
    );
    if (matchKick) {
      Logger.verbose('SquadRcon', 2, `Matched kick message: ${decodedPacket.body}`);

      this.emit('PLAYER_KICKED', {
        raw: decodedPacket.body,
        playerID: matchKick[1],
        steamID: matchKick[3],
        name: matchKick[4],
        time: new Date()
      });

      return;
    }

    const matchSqCreated = decodedPacket.body.match(
      /(.+) \(Online IDs: EOS: ([0-9a-f]{32}) steam: (\d{17})\) has created Squad (\d+) \(Squad Name: (.+)\) on (.+)/
    );
    if (matchSqCreated) {
      Logger.verbose('SquadRcon', 2, `Matched Squad Created: ${decodedPacket.body}`);

      this.emit('SQUAD_CREATED', {
        time: new Date(),
        playerName: matchSqCreated[1],
        playerSteamID: matchSqCreated[3],
        squadID: matchSqCreated[4],
        squadName: matchSqCreated[5],
        teamName: matchSqCreated[6]
      });

      return;
    }

    const matchBan = decodedPacket.body.match(
      /Banned player ([0-9]+)\. \[steamid=(.*?)\] (.*) for interval (.*)/
    );
    if (matchBan) {
      Logger.verbose('SquadRcon', 2, `Matched ban message: ${decodedPacket.body}`);

      this.emit('PLAYER_BANNED', {
        raw: decodedPacket.body,
        playerID: matchBan[1],
        steamID: matchBan[2],
        name: matchBan[3],
        interval: matchBan[4],
        time: new Date()
      });
    }
  }

  async getCurrentMap() {
    const response = await this.execute('ShowCurrentMap');
    const match = response.match(/^Current level is (.*), layer is (.*)/);
    return { level: match[1], layer: match[2] };
  }

  async getNextMap() {
    const response = await this.execute('ShowNextMap');
    const match = response.match(/^Next level is (.*), layer is (.*)/);
    return {
      level: match[1] !== '' ? match[1] : null,
      layer: match[2] !== 'To be voted' ? match[2] : null
    };
  }

  async getListPlayers(server) {
    const response = await this.execute('ListPlayers');

    const players = [];

    if (!response || response.length < 1) return players;

    for (const line of response.split('\n')) {
      const match = line.match(
        /ID: ([0-9]+) \| Online IDs: EOS: ([0-9a-f]{32}) steam: (\d{17}) \| Name: (.+) \| Team ID: ([0-9]+) \| Squad ID: ([0-9]+|N\/A) \| Is Leader: (True|False) \| Role: ([A-Za-z0-9_]*)\b/
      );
      if (!match) continue;

      if (server && server.rcon) server.rcon.addIds(match[3], match[2]);

      players.push({
        playerID: match[1],
        EOSID: match[2],
        steamID: match[3],
        name: match[4],
        teamID: match[5],
        squadID: match[6] !== 'N/A' ? match[5] : null,
        isLeader: match[7] === 'True',
        role: match[8]
      });
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
        /ID: (\d+) \| Name: (.+) \| Size: (\d+) \| Locked: (True|False) \| Creator Name: (.+) \| Creator Online IDs: EOS: ([\d\w]{32}) steam: (\d{17})/
      );
      const matchSide = line.match(/Team ID: (\d) \((.+)\)/);
      if (matchSide) {
        teamID = matchSide[1];
        teamName = matchSide[2];
      }
      if (!match) continue;
      squads.push({
        squadID: match[1],
        squadName: match[2],
        size: match[3],
        locked: match[4],
        creatorName: match[5],
        creatorSteamID: match[7],
        teamID: teamID,
        teamName: teamName
      });
    }

    return squads;
  }

  async broadcast(message) {
    await this.execute(`AdminBroadcast ${message}`);
  }

  async setFogOfWar(mode) {
    await this.execute(`AdminSetFogOfWar ${mode}`);
  }

  async warn(steamID, message) {
    await this.execute(`AdminWarn "${steamID}" ${message}`);
  }

  // 0 = Perm | 1m = 1 minute | 1d = 1 Day | 1M = 1 Month | etc...
  async ban(steamID, banLength, message) {
    await this.execute(`AdminBan "${steamID}" ${banLength} ${message}`);
  }

  async switchTeam(steamID) {
    await this.execute(`AdminForceTeamChange "${steamID}"`);
  }
}
