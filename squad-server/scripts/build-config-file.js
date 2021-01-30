import SquadServerFactory from '../factory.js';

console.log('Building config...');
SquadServerFactory.buildConfigFile()
  .then(() => {
    console.log('Done.');
  })
  .catch(console.log);
