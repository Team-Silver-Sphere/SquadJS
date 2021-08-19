import LogEvent from '../../core/log-event.js';

export default class AdminBroadcast extends LogEvent {
  constructor(server, data = {}) {
    super(server, data);

    this.message = data.message;
  }
}
