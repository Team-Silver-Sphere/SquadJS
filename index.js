import printLogo from 'core/utils/print-logo';
import buildSquadJS from 'factory';

printLogo();
buildSquadJS('./config-test.json')
  .then((server) => server.watch())
  .catch(console.log);
