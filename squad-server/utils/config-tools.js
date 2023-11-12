function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export default class ConfigTools {
  static mergeConfigs(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          ConfigTools.mergeConfigs(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    if (Array.isArray(target) && Array.isArray(source)) {
      target = [...target, ...source];
    }

    return ConfigTools.mergeConfigs(target, ...sources);
  }
}
