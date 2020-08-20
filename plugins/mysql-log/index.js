import {
  LOG_PARSER_NEW_GAME,
  LOG_PARSER_PLAYER_WOUNDED,
  LOG_PARSER_PLAYER_DIED,
  LOG_PARSER_PLAYER_REVIVED,
  LOG_PARSER_SERVER_TICK_RATE
} from 'squad-server/events/log-parser';
import { SERVER_PLAYERS_UPDATED } from 'squad-server/events/server';

export default {
  name: 'mysql-log',
  description: 'Log server information and statistics to a MySQL DB.',
  defaultDisabled: true,

  optionsSpec: {
    mysqlPool: {
      type: 'MySQLPoolConnector',
      required: true,
      default: 'mysql',
      description: 'The name of the MySQL Pool Connector to use.'
    },
    overrideServerID: {
      type: 'Int',
      required: false,
      default: null,
      description: 'A overridden server ID.'
    }
  },

  init: async (server, options) => {
    const serverID = options.overrideServerID === null ? server.id : options.overrideServerID;

    server.on(LOG_PARSER_SERVER_TICK_RATE, (info) => {
      options.mysqlPool.query(
        'INSERT INTO ServerTickRate(time, server, tick_rate) VALUES (?,?,?)',
        [info.time, serverID, info.tickRate]
      );
    });

    server.on(SERVER_PLAYERS_UPDATED, (players) => {
      options.mysqlPool.query(
        'INSERT INTO PlayerCount(time, server, player_count) VALUES (NOW(),?,?)',
        [serverID, players.length]
      );
    });

    server.on(LOG_PARSER_NEW_GAME, (info) => {
      options.mysqlPool.query('call NewMatch(?,?,?,?,?,?,?)', [
        serverID,
        info.time,
        info.dlc,
        info.mapClassname,
        info.layerClassname,
        info.map,
        info.layer
      ]);
    });

    server.on(LOG_PARSER_PLAYER_WOUNDED, (info) => {
      options.mysqlPool.query('call InsertPlayerWounded(?,?,?,?,?,?,?,?,?,?,?,?,?)', [
        serverID,
        info.time,
        info.victim ? info.victim.steamID : null,
        info.victim ? info.victim.name : null,
        info.victim ? info.victim.teamID : null,
        info.victim ? info.victim.squadID : null,
        info.attacker ? info.attacker.steamID : null,
        info.attacker ? info.attacker.name : null,
        info.attacker ? info.attacker.teamID : null,
        info.attacker ? info.attacker.squadID : null,
        info.damage,
        info.weapon,
        info.teamkill
      ]);
    });

    server.on(LOG_PARSER_PLAYER_DIED, (info) => {
      options.mysqlPool.query('call InsertPlayerDied(?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [
        serverID,
        info.time,
        info.woundTime,
        info.victim ? info.victim.steamID : null,
        info.victim ? info.victim.name : null,
        info.victim ? info.victim.teamID : null,
        info.victim ? info.victim.squadID : null,
        info.attacker ? info.attacker.steamID : null,
        info.attacker ? info.attacker.name : null,
        info.attacker ? info.attacker.teamID : null,
        info.attacker ? info.attacker.squadID : null,
        info.damage,
        info.weapon,
        info.teamkill
      ]);
    });

    server.on(LOG_PARSER_PLAYER_REVIVED, (info) => {
      options.mysqlPool.query('call InsertPlayerRevived(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [
        serverID,
        info.time,
        info.woundTime,
        info.victim ? info.victim.steamID : null,
        info.victim ? info.victim.name : null,
        info.victim ? info.victim.teamID : null,
        info.victim ? info.victim.squadID : null,
        info.attacker ? info.attacker.steamID : null,
        info.attacker ? info.attacker.name : null,
        info.attacker ? info.attacker.teamID : null,
        info.attacker ? info.attacker.squadID : null,
        info.damage,
        info.weapon,
        info.teamkill,
        info.reviver ? info.reviver.steamID : null,
        info.reviver ? info.reviver.name : null,
        info.reviver ? info.reviver.teamID : null,
        info.reviver ? info.reviver.squadID : null
      ]);
    });
  }
};
