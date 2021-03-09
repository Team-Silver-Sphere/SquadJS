import axios from 'axios';
import Logger from 'core/logger';

export default class AwnAPI {
  constructor(options) {
    this.orgID = options.orgID;
    this.xAuthToken = null;
  }

  async auth(options) {
    const requestData = {
      username: `${options.creds.username}`,
      password: `${options.creds.password}`
    };
    const res = await this.request('post', '/v5/auth/login', requestData);

    if (res.status === 200 && res.data.valid) {
      this.xAuthToken = res.data.accessToken;
      Logger.verbose('awnAPI', 1, `Authentication succeeded.`);
    }
  }

  async request(method, endpoint, data) {
    let ret = null;

    if (!endpoint.startsWith('/')) endpoint = `/${endpoint}`;
    if (!endpoint.startsWith('/v5/')) endpoint = `/v5/org/${this.orgID}${endpoint}`;
    if (endpoint.includes(':orgId')) endpoint = endpoint.replace(':orgId', `${this.orgID}`);

    try {
      const axiosRequest = {
        method: method,
        url: `https://api.awn.gg${endpoint}`,
        data: data,
        headers: { 'X-AWN-ACCESS-TOKEN': this.xAuthToken }
      };

      Logger.verbose('awnAPI', 1, `${axiosRequest.method.toUpperCase()}: ${axiosRequest.url}`);
      Logger.verbose('awnAPI', 3, `Request Data: ${JSON.stringify(data)}`);

      const res = await axios(axiosRequest);

      ret = { status: res.status, statusText: res.statusText, data: res.data };
      Logger.verbose('awnAPI', 3, `${JSON.stringify(ret)}`);
      return ret;
    } catch (err) {
      ret = {
        status: err.response.status,
        statusText: err.response.statusText,
        error: err.response.data.error
      };
      Logger.verbose('awnAPI', 1, `ERROR: ${JSON.stringify(err.response.status)}`);
      Logger.verbose('awnAPI', 3, `ERROR: ${JSON.stringify(ret)}`);
      return ret;
    }
  }

  async addAdmin(listID, steamID) {
    const ret = await this.request('post', `game-servers/admin-lists/${listID}/admins`, {
      type: 'steam64',
      value: `${steamID}`
    });
    ret.success = ret.status === 200;
    return ret;
  }

  async getAdmin(listID, adminID) {
    const ret = await this.request('get', `game-servers/admin-lists/${listID}/admins/${adminID}`);
    ret.success = ret.status === 200;
    return ret;
  }

  async removeAdmin(listID, adminID) {
    const ret = await this.request(
      'delete',
      `game-servers/admin-lists/${listID}/admins/${adminID}`
    );
    ret.success = ret.status === 204;
    return ret;
  }

  async getAdminList(listID) {
    const ret = await this.request('get', `game-servers/admin-lists/${listID}`);
    ret.success = ret.status === 200;
    return ret;
  }
}
