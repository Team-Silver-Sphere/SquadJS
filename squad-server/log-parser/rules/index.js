import ConnectionName from './connection-name.js';
import ConnectionSteamID from './connection-steam-id.js';
import NewGame from './new-game.js';
import PlayerDamage from './player-damage.js';
import PlayerDie from './player-die.js';
import PlayerWound from './player-wound.js';
import Revive from './revive.js';
import ServerTickRate from './server-tick-rate.js';
import Teamkilled from './teamkilled.js';

export default [
  // noMatchActions
  Teamkilled,

  'END_NO_MATCH_ACTION',

  // rest
  ConnectionName,
  ConnectionSteamID,
  NewGame,
  PlayerDamage,
  PlayerWound,
  PlayerDie,
  Revive,
  ServerTickRate
];
