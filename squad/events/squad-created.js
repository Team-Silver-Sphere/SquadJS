import Event from '../../core/event.js';

export default class SquadCreated extends Event {
  constructor(server, data = {}) {
    super(server, data);

    this.squad = data.squad;
    this.oldValues = data.oldValues;
    this.newValues = data.newValues;
  }
}
