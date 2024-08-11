import chalk from 'chalk';

class Logger {
  constructor() {
    this.verboseness = {};
    this.colors = {};
    this.includeTimestamps = false;
  }

  verbose(module, verboseness, message, ...extras) {
    let colorFunc = chalk[this.colors[module] || 'white'];
    if (typeof colorFunc !== 'function') colorFunc = chalk.white;

    if ((this.verboseness[module] || 1) >= verboseness)
      console.log(
        `${this.includeTimestamps ? '[' + new Date().toISOString() + ']' : ''}[${colorFunc(
          module
        )}][${verboseness}] ${message}`,
        ...extras
      );
  }

  setConfig(config = {}) {
    // Set verboseness levels for the different modules.
    for (const [module, verboseness] of Object.entries(config.verboseness || {})) {
      this.verboseness[module] = verboseness;
    }

    // Set the colours for the different modules.
    for (const [module, color] of Object.entries(config.colors || {})) {
      this.colors[module] = color;
    }

    // Set the timestamp option.
    this.includeTimestamps = config.timestamps;
  }
}

export default new Logger();
