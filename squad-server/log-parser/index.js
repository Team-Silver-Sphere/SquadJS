import LogParser from 'core/log-parser';

import AdminBroadcast from './admin-broadcast.js';
import NewGame from './new-game.js';
import PlayerConnected from './player-connected.js';
import PlayerDamaged from './player-damaged.js';
import PlayerDied from './player-died.js';
import PlayerPossess from './player-possess.js';
import PlayerRevived from './player-revived.js';
import PlayerUnPossess from './player-un-possess.js';
import PlayerWounded from './player-wounded.js';
import RoundWinner from './round-winner.js';
import ServerTickRate from './server-tick-rate.js';
import SteamIDConnected from './steamid-connected.js';

export default class SquadLogParser extends LogParser {
  constructor(options) {
    super('SquadGame.log', options);
  }

  getRules() {
    return [
      AdminBroadcast,
      NewGame,
      PlayerConnected,
      PlayerDamaged,
      PlayerDied,
      PlayerPossess,
      PlayerRevived,
      PlayerUnPossess,
      PlayerWounded,
      RoundWinner,
      ServerTickRate,
      SteamIDConnected
    ];
  }
}
