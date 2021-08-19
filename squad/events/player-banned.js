import Event from '../../core/event.js';

export default class PlayerBanned extends Event {
  constructor(server, data = {}) {
    super(server, data);

    this.player = data.player;
    this.duration = data.duration;
  }
}
