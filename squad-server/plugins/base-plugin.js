import Logger from 'core/logger';

export default class BasePlugin {
  constructor(server, options, connectors) {
    this.server = server;
    this.options = {};
    this.rawOptions = options;

    for (const [optionName, option] of Object.entries(this.constructor.optionsSpecification)) {
      if (option.connector) {
        this.options[optionName] = connectors[this.rawOptions[optionName]];
      } else {
        if (option.required) {
          if (!(optionName in this.rawOptions))
            throw new Error(`${this.constructor.name}: ${optionName} is required but missing.`);
          if (option.default === this.rawOptions[optionName])
            throw new Error(
              `${this.constructor.name}: ${optionName} is required but is the default value.`
            );
        }

        this.options[optionName] =
          typeof this.rawOptions[optionName] !== 'undefined'
            ? this.rawOptions[optionName]
            : option.default;
      }
    }
  }

  async prepareToMount() {}

  async mount() {}

  async unmount() {}

  static get description() {
    throw new Error('Plugin missing "static get description()" method.');
  }

  static get defaultEnabled() {
    throw new Error('Plugin missing "static get defaultEnabled()" method.');
  }

  static get optionsSpecification() {
    throw new Error('Plugin missing "static get optionSpecification()" method.');
  }

  normalizeTarget(target) {
    if (typeof target === 'string') {
      return Array.from(target);
    }
    if (target === null) {
      return [];
    }
    if (Array.isArray(target)) {
      return target;
    }
    if (target instanceof Set) {
      return [...target];
    }
    return Array.from(target);
  }

  /**
   * setTimeout w/ Promise
   * @param {number} ms - Timeout in milliseconds (ms)
   * @returns {Promise} Promise object
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  validator(obj, locate) {
    let result = null;
    for (const key in obj) {
      if (key === locate) {
        result = obj[key];
        break;
      } else if (obj[key] instanceof Object) {
        result = this.validator(obj[key], locate);
      }
    }
    return result;
  }

  validate(info, template) {
    if (!this.isObj(info)) {
      return 'Undefined';
    }
    const formatted = template.replace(/(<[\w\d]+>)/g, (_match, root) => {
      const mfind = (txt) => {
        const reg = new RegExp(txt, 'g');
        const txtMatch = root.match(/[\w\d]+/g)[0].match(reg) || [];
        return !!txtMatch.length;
      };
      const mFormat = (key, alt) => {
        const extras = alt ?? key;
        return this.isNull(key) ? root : extras;
      };
      let response = null;
      if (mfind('steamID')) {
        response = mFormat(this.validator(info, 'steamID'));
      } else if (mfind('squadID')) {
        response = mFormat(this.validator(info, 'squadID'));
      } else if (mfind('squadName')) {
        response = mFormat(this.validator(info, 'squadName'));
      } else if (mfind('name')) {
        response = mFormat(this.validator(info, 'name'));
      } else if (mfind('TeamID')) {
        response = mFormat(this.validator(info, 'teamID'));
      } else if (mfind('teamName')) {
        response = mFormat(this.validator(info, 'teamName'));
      } else {
        response = root;
      }
      return response;
    });
    return formatted;
  }

  /**
   * Object is Null
   * @param {Object} obj - Object
   * @returns {boolean} Returns if statement true or false
   */
  isNull(obj) {
    return Object.is(obj, null) || Object.is(obj, undefined);
  }

  /**
   * Object is Blank
   * @param {(Object|Object[]|string)} obj - Array, Set, Object or String
   * @returns {boolean} Returns if statement true or false
   */
  isBlank(obj) {
    return (
      (typeof obj === 'string' && Object.is(obj.trim(), '')) ||
      (obj instanceof Set && Object.is(obj.size, 0)) ||
      (Array.isArray(obj) && Object.is(obj.length, 0)) ||
      (obj instanceof Object &&
        typeof obj.entries !== 'function' &&
        Object.is(Object.keys(obj).length, 0))
    );
  }

  /**
   * Object is Empty
   * @param {(Object|Object[]|string)} obj - Array, object or string
   * @returns {boolean} Returns if statement true or false
   */
  isEmpty(obj) {
    return this.isNull(obj) || this.isBlank(obj);
  }

  isObj(obj) {
    return (obj instanceof Object && typeof obj.entries !== 'function') || typeof obj === 'object';
  }

  isValid(info, template) {
    const check = this.validate(info, template);
    if (Object.is(check, template)) {
      return false;
    }
    return check;
  }

  // #region Console Logs
  dbg(...msg) {
    Logger.verbose(...msg);
  }

  err(...msg) {
    Logger.verbose('Err', 1, ...msg);
  }

  verbose(...args) {
    Logger.verbose(this.constructor.name, ...args);
  }
  // #endregion
}
