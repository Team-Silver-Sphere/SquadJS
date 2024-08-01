const ID_MATCHER = /\s*(?<name>[^\s:]+)\s*:\s*(?<id>[^\s]+)/g;

// COMMON CONSTANTS

/** All possible IDs that a player can have. */
export const playerIdNames = ['steamID', 'eosID'];

// PARSING AND ITERATION

/**
 * Main function intended for parsing `Online IDs:` body.
 * @arg {string} idsStr - String with ids. Extra whitespace is allowed,
 *   Number of {platform: ID} pairs can be arbitrary. String example:
     " platform1:id1 platform2: id2    platform3  :  id3   "
     Keys and values are not allowed contain colons or whitespace
     characters.
 * @returns {IdsIterator} An iterator that yields {platform: ID} pairs.
 */
export const iterateIDs = (idsStr) => {
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

/**
 * Generates capitalized ID names. Examples:
 *   steam -> SteamID
 *   EOSID -> EOSID
 */
export const capitalID = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1) + 'ID';
};

/**
 * Generates lowercase ID names. Examples:
 *   steam -> steamID
 *   EOSID -> eosID
 */
export const lowerID = (str) => {
  return str.toLowerCase() + 'ID';
};
