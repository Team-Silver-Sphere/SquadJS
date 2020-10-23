export default class BasePlugin {
  static get description() {
    throw new Error('Plugin missing "static get description()" method.');
  }

  static get defaultEnabled() {
    throw new Error('Plugin missing "static get defaultEnabled()" method.');
  }

  static get optionsSpecification() {
    throw new Error('Plugin missing "static get optionSpecification()" method.');
  }

  constructor(server, options = {}) {
    this.server = server;
    this.options = options;
  }
}
