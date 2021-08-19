import logger from '../utils/logger.js';

export default class Plugin {
  async handleEvent(event) {
    // Get the name of the event handler method.
    const methodName = `on${event.constructor.name}`;

    // Check the event handler method exists before calling it.
    if (typeof this[methodName] !== 'function') {
      logger.warn(`Plugin missing event handler method (${methodName}).`);
      return;
    }

    // Call the event handler method.
    await Promise.allSettled([this.onEvent(event), this[methodName](event)]);
  }

  mount() {}
  unmount() {}

  async onEvent(event) {}
}
