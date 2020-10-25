class Logger {
  constructor() {
    this.verboseness = {};
  }

  verbose(module, verboseness, message, ...extras) {
    if((this.verboseness[module] || 1) >= verboseness) console.log(`[${module}][${verboseness}] ${message}`, ...extras);
  }

  setVerboseness(module, verboseness) {
    this.verboseness[module] = verboseness;
  }
}

export default new Logger();