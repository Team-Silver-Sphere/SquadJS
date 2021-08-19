import EventEmitter from 'events';
import path from 'path';

export const ACTIVE_LOG_FILE = 'ACTIVE_LOG_FILE';

export default class BaseFileSystemHandler extends EventEmitter {
  constructor(options = {}) {
    super();

    this.root = options.root || '/';
  }

  getPathTo(type, ...args) {
    switch (type) {
      case ACTIVE_LOG_FILE:
        return path.join(this.root, './SquadGame/Saved/Logs/SquadGame.log');
      default:
        throw new Error('Unknown path type.');
    }
  }

  async startTailingLogs() {
    throw new Error('startTailingLogs method not implemented.');
  }

  async stopTailingLogs() {
    throw new Error('stopTailingLogs method not implemented.');
  }
}
