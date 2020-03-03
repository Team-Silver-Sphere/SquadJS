import Influx from 'influx';

import {
  INFLUXDB_HOST,
  INFLUXDB_PORT,
  INFLUXDB_USERNAME,
  INFLUXDB_PASSWORD,
  INFLUXDB_DATABASE,
  INFLUXDB_WRITE_INTERVAL
} from 'core/config';

class InfluxDBConnector {
  constructor() {
    this.influx = new Influx.InfluxDB({
      host: INFLUXDB_HOST,
      port: INFLUXDB_PORT,
      username: INFLUXDB_USERNAME,
      password: INFLUXDB_PASSWORD,
      database: INFLUXDB_DATABASE,
      schema: [
        {
          measurement: 'ServerTickRate',
          fields: {
            tick_rate: Influx.FieldType.FLOAT
          },
          tags: ['server']
        },
        {
          measurement: 'Match',
          fields: {
            map: Influx.FieldType.STRING,
            layer: Influx.FieldType.STRING
          },
          tags: ['server']
        },
        {
          measurement: 'PlayerWound',
          fields: {
            victim: Influx.FieldType.STRING,
            victimName: Influx.FieldType.STRING,
            victimTeamID: Influx.FieldType.INTEGER,
            victimSquadID: Influx.FieldType.INTEGER,
            attacker: Influx.FieldType.STRING,
            attackerName: Influx.FieldType.STRING,
            attackerTeamID: Influx.FieldType.INTEGER,
            attackerSquadID: Influx.FieldType.INTEGER,
            damage: Influx.FieldType.STRING,
            weapon: Influx.FieldType.STRING,
            teamkill: Influx.FieldType.BOOLEAN
          },
          tags: ['server']
        },
        {
          measurement: 'PlayerDie',
          fields: {
            victim: Influx.FieldType.STRING,
            victimName: Influx.FieldType.STRING,
            victimTeamID: Influx.FieldType.INTEGER,
            victimSquadID: Influx.FieldType.INTEGER,
            attacker: Influx.FieldType.STRING,
            attackerName: Influx.FieldType.STRING,
            attackerTeamID: Influx.FieldType.INTEGER,
            attackerSquadID: Influx.FieldType.INTEGER,
            damage: Influx.FieldType.STRING,
            weapon: Influx.FieldType.STRING,
            teamkill: Influx.FieldType.BOOLEAN
          },
          tags: ['server']
        },
        {
          measurement: 'Revive',
          fields: {
            victim: Influx.FieldType.STRING,
            victimName: Influx.FieldType.STRING,
            victimTeamID: Influx.FieldType.INTEGER,
            victimSquadID: Influx.FieldType.INTEGER,
            attacker: Influx.FieldType.STRING,
            attackerName: Influx.FieldType.STRING,
            attackerTeamID: Influx.FieldType.INTEGER,
            attackerSquadID: Influx.FieldType.INTEGER,
            damage: Influx.FieldType.STRING,
            weapon: Influx.FieldType.STRING,
            teamkill: Influx.FieldType.BOOLEAN,
            reviver: Influx.FieldType.STRING,
            reviverName: Influx.FieldType.STRING,
            reviverTeamID: Influx.FieldType.INTEGER,
            reviverSquadID: Influx.FieldType.INTEGER
          },
          tags: ['server']
        }
      ]
    });

    this.points = [];
    setInterval(() => {
      this.influx.writePoints(this.points);
      this.points = [];
    }, INFLUXDB_WRITE_INTERVAL);
  }

  writePoint(point) {
    this.points.push(point);
  }
}

export default new InfluxDBConnector();
