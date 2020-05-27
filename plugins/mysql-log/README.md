<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - MySQL Log
</div>

## About
The MySQL log plugin logs event information into a MySQL database to allow it to be queried for analysis, monitoring, or stat tracking. Works well with Grafana.

## Requirements
 * MySQL database (This plugin has been tried with version 8.x.x, so it is suggested you use the same).
 * You may need to enable a different authentication method for it to work. Follow [this guide](https://stackoverflow.com/questions/50093144/mysql-8-0-client-does-not-support-authentication-protocol-requested-by-server) to learn how to do that.
 * Execute the [`mysql-schema.sql`](https://github.com/Thomas-Smyth/SquadJS/blob/master/plugins/mysql-log/mysql-schema.sql) in the database to setup the tables, etc.
 * Add your server to the database... `INSERT INTO Server (name) VALUES ("[EU] The Coalition");` Please make sure the inserted ID is the same as that of the server in the `index.js` file.
 * If you encounter any issues with this plugin, enable `debug: true` in the `mysql.createPool` constructor. This will cause errors to be logged to the console.

## Installation
```js
// Place the following two lines at the top of your index.js file.
import mysql from 'mysql';
import { mysqlLog } from 'plugins';

// Place the following lines in your index.js file. Replace the credentials with the credentials of your MySQL database.
const mysqlPool = mysql.createPool({
connectionLimit: 10,
host: 'host',
port: 3306,
user: 'squadjs',
password: 'password',
database: 'squadjs'
});
mysqlLog(server, mysqlPool);
```
