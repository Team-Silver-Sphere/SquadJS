import {
  LOG_PARSER_NEW_GAME,
  LOG_PARSER_PLAYER_DIED,
  LOG_PARSER_PLAYER_WOUNDED,
  LOG_PARSER_PLAYER_REVIVED,
  LOG_PARSER_SERVER_TICK_RATE
} from 'squad-server/events/log-parser';

import { SERVER_PLAYERS_UPDATED } from 'squad-server/events/server';

export default function influxdbLog(server, influxDB, options = {}) {
  if (!server)
    throw new Error(
      'InfluxDBLog must be provided with a reference to the server.'
    );

  if (!influxDB)
    throw new Error('InfluxDBLog must be provided with a InfluxDB connection.');
  
  const serverID = options.overrideServerID || server.id;

  let points = [];
  setInterval(() => {
    influxDB.writePoints(points);
    points = [];
  }, options.writeInterval || 30 * 1000);

  server.on(LOG_PARSER_SERVER_TICK_RATE, info => {
    points.push({
      measurement: 'ServerTickRate',
      tags: { server: serverID },
      fields: { tick_rate: info.tickRate },
      timestamp: info.time
    });
  });

  server.on(SERVER_PLAYERS_UPDATED, players => {
    points.push({
      measurement: 'PlayerCount',
      tags: { server: serverID },
      fields: { player_count: players.length },
      timestamp: new Date()
    });
  });

  server.on(LOG_PARSER_NEW_GAME, info => {
    points.push({
      measurement: 'Match',
      tags: { server: serverID },
      fields: {
        dlc: info.dlc,
        mapClassname: info.mapClassname,
        layerClassname: info.layerClassname,
        map: info.map,
        layer: info.layer
      },
      timestamp: info.time
    });
  });

  server.on(LOG_PARSER_PLAYER_WOUNDED, info => {
    points.push({
      measurement: 'PlayerWounded',
      tags: { server: serverID },
      fields: {
        victim: info.victim ? info.victim.steamID : null,
        victimName: info.victim ? info.victim.name : null,
        victimTeamID: info.victim ? info.victim.teamID : null,
        victimSquadID: info.victim ? info.victim.squadID : null,
        attacker: info.attacker ? info.attacker.steamID : null,
        attackerName: info.attacker ? info.attacker.name : null,
        attackerTeamID: info.attacker ? info.attacker.teamID : null,
        attackerSquadID: info.attacker ? info.attacker.squadID : null,
        damage: info.damage,
        weapon: info.weapon,
        teamkill: info.teamkill
      },
      timestamp: info.time
    });
  });

  server.on(LOG_PARSER_PLAYER_DIED, info => {
    points.push({
      measurement: 'PlayerDied',
      tags: { server: serverID },
      fields: {
        victim: info.victim ? info.victim.steamID : null,
        victimName: info.victim ? info.victim.name : null,
        victimTeamID: info.victim ? info.victim.teamID : null,
        victimSquadID: info.victim ? info.victim.squadID : null,
        attacker: info.attacker ? info.attacker.steamID : null,
        attackerName: info.attacker ? info.attacker.name : null,
        attackerTeamID: info.attacker ? info.attacker.teamID : null,
        attackerSquadID: info.attacker ? info.attacker.squadID : null,
        damage: info.damage,
        weapon: info.weapon,
        teamkill: info.teamkill
      },
      timestamp: info.time
    });
  });

  server.on(LOG_PARSER_PLAYER_REVIVED, info => {
    points.push({
      measurement: 'PlayerRevived',
      tags: { server: serverID },
      fields: {
        victim: info.victim ? info.victim.steamID : null,
        victimName: info.victim ? info.victim.name : null,
        victimTeamID: info.victim ? info.victim.teamID : null,
        victimSquadID: info.victim ? info.victim.squadID : null,
        attacker: info.attacker ? info.attacker.steamID : null,
        attackerName: info.attacker ? info.attacker.name : null,
        attackerTeamID: info.attacker ? info.attacker.teamID : null,
        attackerSquadID: info.attacker ? info.attacker.squadID : null,
        damage: info.damage,
        weapon: info.weapon,
        teamkill: info.teamkill,
        reviver: info.reviver ? info.reviver.steamID : null,
        reviverName: info.reviver ? info.reviver.name : null,
        reviverTeamID: info.reviver ? info.reviver.teamID : null,
        reviverSquadID: info.reviver ? info.reviver.squadID : null
      },
      timestamp: info.time
    });
  });
}
