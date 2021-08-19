export default class Squad {
  constructor(server, data = {}) {
    this.server = server;

    this.team = data.team;

    this.id = data.id;
    this.name = data.name;
    this.locked = data.locked;

    this.creator = data.creator;
  }
}
