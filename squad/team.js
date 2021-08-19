export default class Team {
  constructor(server, data = {}) {
    this.server = server;

    this.id = data.id;
    this.name = data.name;
  }
}
