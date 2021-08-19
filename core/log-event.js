import moment from 'moment';

import Event from './event.js';

export default class LogEvent extends Event {
  constructor(server, data) {
    data.time = moment.utc(data.time, 'YYYY.MM.DD-hh.mm.ss:SSS').toDate();

    super(server, data);

    this.raw = data.raw;
    this.chainID = data.chainID;
  }
}
