import Logger from 'core/logger';
import Rcon from 'core/rcon';

export default class SquadRcon extends Rcon {
  processChatPacket(decodedPacket) {
    const matchChat = decodedPacket.body.match(
      /\[(ChatAll|ChatTeam|ChatSquad|ChatAdmin)] \[SteamID:([0-9]{17})] (.+?) : (.*)/
    );
    if (matchChat) {
      Logger.verbose('SquadRcon', 2, `Matched chat message: ${decodedPacket.body}`);

      this.emit('CHAT_MESSAGE', {
        raw: decodedPacket.body,
        chat: matchChat[1],
        steamID: matchChat[2],
        name: matchChat[3],
        message: matchChat[4],
        time: new Date()
      });

      return;
    }

    const matchPossessedAdminCam = decodedPacket.body.match(
      /\[SteamID:([0-9]{17})] (.+?) has possessed admin camera./
    );
    if (matchPossessedAdminCam) {
      Logger.verbose('SquadRcon', 2, `Matched admin camera possessed: ${decodedPacket.body}`);
      this.emit('POSSESSED_ADMIN_CAMERA', {
        raw: decodedPacket.body,
        steamID: matchPossessedAdminCam[1],
        name: matchPossessedAdminCam[2],
        time: new Date()
      });

      return;
    }

    const matchUnpossessedAdminCam = decodedPacket.body.match(
      /\[SteamID:([0-9]{17})] (.+?) has unpossessed admin camera./
    );
    if (matchUnpossessedAdminCam) {
      Logger.verbose('SquadRcon', 2, `Matched admin camera possessed: ${decodedPacket.body}`);
      this.emit('UNPOSSESSED_ADMIN_CAMERA', {
        raw: decodedPacket.body,
        steamID: matchUnpossessedAdminCam[1],
        name: matchUnpossessedAdminCam[2],
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
      /Kicked player ([0-9]+)\. \[steamid=([0-9]{17})] (.*)/
    );
    if (matchKick) {
      Logger.verbose('SquadRcon', 2, `Matched kick message: ${decodedPacket.body}`);

      this.emit('PLAYER_KICKED', {
        raw: decodedPacket.body,
        playerID: matchKick[1],
        steamID: matchKick[2],
        name: matchKick[3],
        time: new Date()
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

  // Returns the current layer
  async getCurrentMap() {
    const response = await this.execute('ShowCurrentMap');
    const match = response.match(/^Current level is (.*), layer is (.*)/);
    return { level: match[1], layer: match[2] };
  }

  // Returns the next layer
  async getNextMap() {
    const response = await this.execute('ShowNextMap');
    const match = response.match(/^Next level is (.*), layer is (.*)/);
    return {
      level: match[1] !== '' ? match[1] : null,
      layer: match[2] !== 'To be voted' ? match[2] : null
    };
  }

  // Returns a list with current players
  async getListPlayers() {
    const response = await this.execute('ListPlayers');

    const players = [];

    for (const line of response.split('\n')) {
      const match = line.match(
        /ID: ([0-9]+) \| SteamID: ([0-9]{17}) \| Name: (.+) \| Team ID: ([0-9]+) \| Squad ID: ([0-9]+|N\/A)/
      );
      if (!match) continue;

      players.push({
        playerID: match[1],
        steamID: match[2],
        name: match[3],
        teamID: match[4],
        squadID: match[5] !== 'N/A' ? match[5] : null
      });
    }

    return players;
  }

  // Returns a list with current squads
  async getSquads() {
    const responseSquad = await this.execute('ListSquads');

    const squads = [];
    let teamName;
    let teamID;

    for (const line of responseSquad.split('\n')) {
      const match = line.match(
        /ID: ([0-9]+) \| Name: (.+) \| Size: ([0-9]+) \| Locked: (True|False)/
      );
      const matchSide = line.match(/Team ID: (1|2) \((.+)\)/);
      if (matchSide) {
        teamID = matchSide[1];
        teamName = matchSide[2];
      }
      if (!match) continue;
      await squads.push({
        squadID: match[1],
        squadName: match[2],
        size: match[3],
        locked: match[4],
        teamID: teamID,
        teamName: teamName
      });
    }

    return squads;
  }

  // Broadcasts a message on the server
  async broadcast(message) {
    await this.execute(`AdminBroadcast ${message}`);
  }

  // Sets the mode for the FoW
  async setFogOfWar(mode) {
    await this.execute(`AdminSetFogOfWar ${mode}`);
  }

  // Warns the player with a reason
  async warn(steamID, message) {
    await this.execute(`AdminWarn "${steamID}" ${message}`);
  }

  // Bans the player from the server for a predefined time and reason
  // 0 = Perm | 1m = 1 minute | 1d = 1 Day | 1M = 1 Month | etc...
  async ban(steamID, banLength, message) {
    await this.execute(`AdminBan "${steamID}" ${banLength} ${message}`);
  }

  // Kicks the player from the server with a reason
  async kick(steamID, reason) {
    await this.execute(`AdminKick "${steamID}" ${reason}`);
  }

  // Force switches the player from teams/side
  async switchTeam(steamID) {
    await this.execute(`AdminForceTeamChange "${steamID}"`);
  }

  // Ends the match
  async endMatch() {
    await this.execute('AdminEndMatch');
  }

  // Change the map and travel to it immediately
  async changeLayer(layer) {
    await this.execute(`AdminChangeLayer ${layer}`);
  }

  // Set the next map to travel to after this match ends
  async setNextLayer(layer) {
    await this.execute(`AdminSetNextLayer ${layer}`);
  }

  // Set the maximum number of players for this server
  async setMaxPlayers(maxPlayers) {
    await this.execute(`AdminSetMaxNumPlayers ${maxPlayers}`);
  }

  // Set the clock speed on the server 0.1 is 10% of normal speed 2.0 is twice the normal speed
  async setSlomo(timeDilation) {
    await this.execute(`AdminSlomo ${timeDilation}`);
  }

  // List recently disconnected player ids with associated player name and SteamId
  async listDisconnectedPlayers() {
    await this.execute(`AdminListDisconnectedPlayers`);
  }

  // Demote a commander specified by player name or Steam Id
  async demoteCommander(steamID) {
    await this.execute(`AdminDemoteCommander "${steamID}"`);
  }

  // Disbands the specified Squad (Which team 1 or 2 you will see on the team screen)
  async disbandSquad(teamID, squadID) {
    await this.execute(`AdminDisbandSquad ${teamID} ${squadID}`);
  }

  // Remove a player from their squad without kicking them
  async removePlayerFromSquad(steamID) {
    await this.execute(`AdminRemovePlayerFromSquad "${steamID}"`);
  }

  // Tell the server to restart the match
  async restartMatch() {
    await this.execute(`AdminRestartMatch`);
  }
}
