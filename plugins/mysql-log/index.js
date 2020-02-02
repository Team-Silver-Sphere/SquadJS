import MySQLConnector from 'connectors/mysql';

import {
  LOG_PARSER_NEW_GAME,
  LOG_PARSER_PLAYER_DIE,
  LOG_PARSER_PLAYER_WOUND,
  LOG_PARSER_REVIVE,
  LOG_PARSER_TICK_RATE
} from 'squad-server/events/log-parser';

export default function mysqlLog(server) {
  server.logParser.on(LOG_PARSER_NEW_GAME, async info => {
    await MySQLConnector.getPool().query(
      'UPDATE game SET endTime = ? WHERE server = ? AND endTime IS NULL',
      [info.time, server.id]
    );

    await MySQLConnector.getPool().query(
      'INSERT INTO game(server, startTime, map, layer) VALUES (?,?,?,?)',
      [server.id, info.time, info.map, info.layer]
    );
  });

  server.logParser.on(LOG_PARSER_PLAYER_DIE, async info => {
    await MySQLConnector.getPool().query(
      'INSERT INTO player_die(time, server, victim, damage, attacker, weapon, teamkill) VALUES (?,?,?,?,?,?,?)',
      [
        info.time,
        server.id,
        info.victim,
        info.damage,
        info.attacker,
        info.weapon,
        info.teamkill
      ]
    );
  });

  server.logParser.on(LOG_PARSER_PLAYER_WOUND, async info => {
    await MySQLConnector.getPool().query(
      'INSERT INTO player_wound(time, server, victim, damage, attacker, weapon, teamkill) VALUES (?,?,?,?,?,?,?)',
      [
        info.time,
        server.id,
        info.victim,
        info.damage,
        info.attacker,
        info.weapon,
        info.teamkill
      ]
    );
  });

  server.logParser.on(LOG_PARSER_REVIVE, async info => {
    await MySQLConnector.getPool().query(
      'INSERT INTO revive(time, server, victim, damage, attacker, weapon, reviver) VALUES (?,?,?,?,?,?,?)',
      [
        info.time,
        server.id,
        info.victim,
        info.damage,
        info.attacker,
        info.weapon,
        info.reviver
      ]
    );
  });

  server.logParser.on(LOG_PARSER_TICK_RATE, async info => {
    await MySQLConnector.getPool().query(
      'INSERT INTO tick_rate(time, server, tick_rate) VALUES (?,?,?)',
      [info.time, server.id, info.tickRate]
    );
  });
}
