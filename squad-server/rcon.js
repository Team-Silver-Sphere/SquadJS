import Rcon from 'core/rcon';

export default class SquadRcon extends Rcon {
  processChatPacket(decodedPacket) {
    const match = decodedPacket.body.match(
      /\[(ChatAll|ChatTeam|ChatSquad|ChatAdmin)] \[SteamID:([0-9]{17})] (.+?) : (.*)/
    );

    this.emit('CHAT_MESSAGE', {
      raw: decodedPacket.body,
      chat: match[1],
      steamID: match[2],
      name: match[3],
      message: match[4],
      time: new Date()
    });
  }

  async broadcast(message) {
    await this.execute(`AdminBroadcast ${message}`);
  }

  async getLayerInfo() {
    const response = await this.execute('ShowNextMap');
    const match = response.match(/^Current map is (.+), Next map is (.*)/);
    return { currentLayer: match[1], nextLayer: match[2].length === 0 ? null : match[2] };
  }

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

  async warn(steamID, message) {
    await this.execute(`AdminWarn "${steamID}" ${message}`);
  }

  async switchTeam(steamID) {
    await this.execute(`AdminForceTeamChange "${steamID}"`);
  }
}
