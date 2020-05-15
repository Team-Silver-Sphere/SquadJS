<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - InfluxDB Log
</div>

## About
The InfluxDB log plugin logs event information into InfluxDB to allow it to be queried for analysis, monitoring, or stat tracking.. Works well with Grafana.

## Requirements
 * InfluxDB database.

## Installation
```js
// Place the following two lines at the top of your index.js file.
import Influx from 'influx';
import { influxdbLog, influxdbLogDefaultSchema } from 'plugins';

// Place the following lines in your index.js file. Replace the credentials with the credentials of your InfluxDB database.
const influxDB = new Influx.InfluxDB({
host: 'host',
port: 8086,
username: 'squadjs',
password: 'password',
database: 'squadjs',
schema: influxdbLogDefaultSchema
});
influxdbLog(server, influxDB);
```
