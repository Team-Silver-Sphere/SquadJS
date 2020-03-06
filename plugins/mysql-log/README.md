<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - MySQL Log
</div>

## About
The MySQL log plugin logs event information into a MySQL database to allow it to be queried for analysis, monitoring, or stat tracking. Works well with Grafana.

## Requirements
 * MySQL database setup
 * Execute the [`mysql-schema.sql`](https://github.com/Thomas-Smyth/SquadJS/blob/master/plugins/mysql-log/mysql-schema.sql) in the database to setup the tables, etc.
 * Place connection information in the `core/config.js` file.

## Installation
Place the following into your `index.js` file.
```js
mysqlLog(server);
```
