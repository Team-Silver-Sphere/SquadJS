import LogEvent from '../../core/log-event.js';

export default class TickRateUpdated extends LogEvent {
  constructor(server, data = {}) {
    super(server, data);

    this.tickRate = data.tickRate;
  }
}
