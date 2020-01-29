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
          measurement: 'tick_rate',
          fields: {
            tick_rate: Influx.FieldType.FLOAT
          },
          tags: ['server']
        },
        {
          measurement: 'game',
          fields: {
            map: Influx.FieldType.STRING,
            layer: Influx.FieldType.STRING
          },
          tags: ['server']
        },
        {
          measurement: 'player_wound',
          fields: {
            victim: Influx.FieldType.STRING,
            damage: Influx.FieldType.FLOAT,
            attacker: Influx.FieldType.STRING,
            weapon: Influx.FieldType.STRING,
            teamkill: Influx.FieldType.BOOLEAN
          },
          tags: ['server']
        },
        {
          measurement: 'player_die',
          fields: {
            victim: Influx.FieldType.STRING,
            damage: Influx.FieldType.FLOAT,
            attacker: Influx.FieldType.STRING,
            weapon: Influx.FieldType.STRING,
            teamkill: Influx.FieldType.BOOLEAN
          },
          tags: ['server']
        },
        {
          measurement: 'revive',
          fields: {
            victim: Influx.FieldType.STRING,
            damage: Influx.FieldType.FLOAT,
            attacker: Influx.FieldType.STRING,
            weapon: Influx.FieldType.STRING,
            reviver: Influx.FieldType.STRING
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
