export default class Player {
  constructor(server, data = {}) {
    this.server = server;

    this.id = data.id;
    this.steamID = data.steamID;
    this.name = data.name;

    this.team = data.team;
    this.squad = data.squad;
  }
}
