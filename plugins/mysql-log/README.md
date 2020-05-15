<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - MySQL Log
</div>

## About
The MySQL log plugin logs event information into a MySQL database to allow it to be queried for analysis, monitoring, or stat tracking. Works well with Grafana.

## Requirements
 * MySQL database.
 * Execute the [`mysql-schema.sql`](https://github.com/Thomas-Smyth/SquadJS/blob/master/plugins/mysql-log/mysql-schema.sql) in the database to setup the tables, etc.
 * Add your server to the database... `INSERT INTO Server (name) VALUES ("[EU] The Coalition");` Please make sure the inserted ID is the same as that of the server in the `index.js` file.

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
