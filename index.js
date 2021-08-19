import SquadPlugin from './squad/plugin.js';
import SquadServer from './squad/server.js';

// Setup server.
const server = new SquadServer({
  host: 'xxx.xxx.xxx.xxx',

  a2sOptions: {
    port: 27175
  },

  rconOptions: {
    port: 21114,
    password: 'password'
  },

  fileSystemHandler: 'ftp',
  fileSystemHandlerOptions: {
    ftp: {
      port: 21,
      user: 'user',
      password: 'password'
    }
  }
});

// Setup example plugin.
class ExamplePlugin extends SquadPlugin {
  async onSquadCreated(event) {
    await event.server.rcon.execute(
      `AdminWarn "${event.squad.creator.steamID}" Please make sure you have the SL kit!`
    );
  }
}

server.mountPlugin(new ExamplePlugin());

// Watch the server.
server.watch();
