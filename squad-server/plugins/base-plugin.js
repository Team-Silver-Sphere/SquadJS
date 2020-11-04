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

  // Its recommended to write the least possible code in the constructor of every plugin
  constructor(server, options = {}, optionsRaw = {}) {
    this.server = server;
    this.options = options;
    this.optionsRaw = optionsRaw;
    this.eventSubscriptionPool = [];
  }

  // Write all code in init same as you would normaly use a constructor
  // If you extend a plugin either copy the code or call super.init()
  // PS. NOT VALID FOR THIS ONE !
  init() {
    throw new Error('Plugin initialisation have to satrt from "init()" method. Its recommended to write as few code as possible in constructor.');
  }

  // When an error ocours while the plugin is being initiated, we can wipe all previously subscribed events and continue on.
  destroy() {
  }
}
