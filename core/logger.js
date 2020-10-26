class Logger {
  constructor() {
    this.verboseness = {};
  }

  verbose(module, verboseness, message, ...extras) {
    if ((this.verboseness[module] || 1) >= verboseness)
      console.log(`[${module}][${verboseness}] ${message}`, ...extras);
  }

  error(module, message, ...extras) {
    console.error(`[${module}][ERROR] ${message}`, ...extras);
  }

  setVerboseness(module, verboseness) {
    this.verbose('SquadServer', 1, `Setting Logger verboseness levels for ${module}...`);
    this.verboseness[module] = verboseness;
  }
}

export default new Logger();
