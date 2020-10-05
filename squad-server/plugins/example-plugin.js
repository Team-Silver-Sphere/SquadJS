import BasePlugin from './base-plugin.js';

export default class ExamplePlugin extends BasePlugin {
  static get description() {
    return 'An example plugin that shows how to implement a basic plugin.';
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      exampleOption: {
        required: false,
        description: 'An example option.',
        default: 'A default value.',
        example: 'An example value.'
      },
      exampleConnector: {
        required: true,
        description: 'An example squadlayerpool connector.',
        connector: 'squadlayerpool',
        default: 'squadlayerpool'
      }
    };
  }

  constructor(server, options) {
    super();

    // bind events onto server object
  }
}
