import gamedig from 'gamedig';

export default class A2SClient {
  constructor(options = {}) {
    // Check required options are specified.
    for (const option of ['host', 'port', 'type'])
      if (!(option in options)) throw new Error(`${option} must be specified.`);

    // Store options.
    this.host = options.host;
    this.port = options.port;
    this.type = options.type;
  }

  async getServerInformation() {
    return gamedig.query({
      host: this.host,
      port: this.port,
      type: this.type
    });
  }
}
