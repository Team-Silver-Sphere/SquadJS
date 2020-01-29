import mysql from 'mysql';

import {
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USERNAME,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
  MYSQL_CONNECTION_LIMIT
} from 'core/config';

class MySQLConnector {
  constructor() {
    this.pool = mysql.createPool({
      connectionLimit: MYSQL_CONNECTION_LIMIT,
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USERNAME,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE
    });
  }

  getPool() {
    return this.pool;
  }
}

export default new MySQLConnector();
