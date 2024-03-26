const ID_MATCHER = /\s*(?<name>[^:]+): (?<id>[^\s]+)/g;

// PARSING AND ITERATION

// main function intended for parsing `Online IDs:` body. Returns an
// iterator that yields `{platform: id}` pairs.
export const iterate = (idsStr) => {
  return new IdsIterator(idsStr.matchAll(ID_MATCHER));
};

class IdsIterator {
  constructor(matchIterator) {
    this.inner = matchIterator;
  }

  [Symbol.iterator]() {
    return this;
  }

  next() {
    const match = this.inner.next();
    if (match.done) return { value: undefined, done: true };
    return { value: { key: match.value[1], value: match.value[2] }, done: false };
  }

  forEach(callbackFn) {
    for (const { key, value } of this) callbackFn(key, value);
  }
}

// FORMATTING

// `steam => SteamID`
export const capitalID = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1) + 'ID';
};

// `EOS => eosID`
export const lowerID = (str) => {
  return str.toLowerCase() + 'ID';
};
