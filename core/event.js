export default class Event {
  constructor(server, data) {
    this.server = server;
    this.time = data.time || new Date();
  }

  toString() {
    return `Name: ${this.constructor.name}`;
  }
}
