import SquadServerFactory from '../factory.js';

console.log('Building readme...');
SquadServerFactory.buildReadmeFile()
  .then(() => {
    console.log('Done.');
  })
  .catch(console.log);
