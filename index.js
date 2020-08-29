import printLogo from 'core/utils/print-logo';
import buildSquadJS from 'factory';

printLogo();
buildSquadJS()
  .then((server) => server.watch())
  .catch(console.log);
