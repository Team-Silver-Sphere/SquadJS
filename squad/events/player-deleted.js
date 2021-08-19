import Event from '../../core/event.js';

export default class PlayerDeleted extends Event {
  constructor(server, data = {}) {
    super(server, data);

    this.player = data.player;
    this.oldValues = data.oldValues;
    this.newValues = data.newValues;
  }
}
