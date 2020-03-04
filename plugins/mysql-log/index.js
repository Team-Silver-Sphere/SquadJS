import MySQLConnector from 'connectors/mysql';

import {
  LOG_PARSER_NEW_GAME,
  LOG_PARSER_PLAYER_WOUND,
  LOG_PARSER_PLAYER_DIE,
  LOG_PARSER_REVIVE,
  LOG_PARSER_TICK_RATE
} from 'squad-server/events/log-parser';
import { SERVER_PLAYERS_UPDATED } from 'squad-server/events/server';

export default function mysqlLog(server) {
  if (!server)
    throw new Error(
      'MySQLLog must be provided with a reference to the server.'
    );

  server.on(LOG_PARSER_TICK_RATE, info => {
    MySQLConnector.getPool().query(
      'INSERT INTO ServerTickRate(time, server, tick_rate) VALUES (?,?,?)',
      [info.time, server.id, info.tickRate]
    );
  });

  server.on(SERVER_PLAYERS_UPDATED, players => {
    MySQLConnector.getPool().query(
      'INSERT INTO PlayerCount(time, server, tick_rate) VALUES (NOW(),?,?)',
      [server.id, players.length]
    );
  });

  server.on(LOG_PARSER_NEW_GAME, info => {
    MySQLConnector.getPool().query('call NewMatch(?,?,?,?)', [
      server.id,
      info.time,
      info.map,
      info.layer
    ]);
  });

  server.on(LOG_PARSER_PLAYER_WOUND, info => {
    MySQLConnector.getPool().query(
      'call InsertPlayerWound(?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [
        server.id,
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
      ]
    );
  });

  server.on(LOG_PARSER_PLAYER_DIE, info => {
    MySQLConnector.getPool().query(
      'call InsertPlayerDie(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [
        server.id,
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
      ]
    );
  });

  server.on(LOG_PARSER_REVIVE, info => {
    MySQLConnector.getPool().query(
      'call InsertPlayerRevive(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [
        server.id,
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
      ]
    );
  });
}
