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

    if (process.env.VERBOSE === 'true' || (this.verboseness[module] || 1) >= verboseness)
      console.log(
        `${this.includeTimestamps ? '[' + new Date().toISOString() + ']' : ''}[${colorFunc(
          module
        )}][${verboseness}] ${message}`,
        ...extras
      );
  }

  setVerboseness(module, verboseness) {
    this.verboseness[module] = verboseness;
  }

  setColor(module, color) {
    this.colors[module] = color;
  }

  setTimeStamps(option) {
    this.includeTimestamps = option;
  }
}

export default new Logger();
