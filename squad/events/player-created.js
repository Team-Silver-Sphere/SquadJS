import Event from '../../core/event.js';

export default class PlayerCreated extends Event {
  constructor(server, data = {}) {
    super(server, data);

    this.player = data.player;
    this.oldValues = data.oldValues;
    this.newValues = data.newValues;
  }
}
