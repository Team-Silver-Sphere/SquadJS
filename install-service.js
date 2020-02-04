import path from 'path';

import NodeWindows from 'node-windows';
const { Service } = NodeWindows;

const svc = new Service({
  name: 'SquadJS',
  script: path.resolve('./index.js')
});

svc.on('install', function() {
  svc.start();
});

svc.install();
