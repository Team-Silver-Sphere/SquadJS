import chalk from 'chalk';

class Logger {
  constructor() {
    this.verboseness = {};
    this.colors = {};
  }

  verbose(module, verboseness, message, ...extras) {
    let colorFunc = chalk[this.colors[module] || 'white'];
    if (typeof colorFunc !== 'function') colorFunc = chalk.white;

    if ((this.verboseness[module] || 1) >= verboseness)
      console.log(`[${colorFunc(module)}][${verboseness}] ${message}`, ...extras);
  }

  setVerboseness(module, verboseness) {
    this.verboseness[module] = verboseness;
  }

  setColor(module, color) {
    this.colors[module] = color;
  }
}

export default new Logger();
