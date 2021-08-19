import Event from '../../core/event.js';

export default class PlayerUnpossessedAdminCamera extends Event {
  constructor(server, data = {}) {
    super(server, data);

    this.player = data.player;
  }
}
