import SquadServer from 'squad-server';

export default function (config) {
  return new SquadServer(config.server);
}
