import Event from '../../core/event.js';

export default class PlayerKicked extends Event {
  constructor(server, data = {}) {
    super(server, data);

    this.player = data.player;
  }
}
