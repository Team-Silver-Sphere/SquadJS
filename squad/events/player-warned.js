import Event from '../../core/event.js';

export default class PlayerWarned extends Event {
  constructor(server, data = {}) {
    super(server, data);

    this.player = data.player;
    this.message = data.message;
  }
}
