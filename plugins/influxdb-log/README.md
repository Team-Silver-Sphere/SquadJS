<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - InfluxDB Log
</div>

## About
The InfluxDB log plugin logs event information into InfluxDB to allow it to be queried for analysis or monitoring. Works well with Grafana.

## Requirements
 * InfluxDB setup & connection information placed in `core/config.js` file.

## Installation
Place the following into your `index.js` file.
```js
influxdbLog(server);
```
