import mapvoteDidYouMean from './mapvote-did-you-mean.js';
import mapvote123 from './mapvote-123.js';

export default function(server, mode, ...args) {
  switch (mode) {
    case 'didyoumean':
      mapvoteDidYouMean(server, ...args);
      break;
    case '123':
      mapvote123(server, ...args);
      break;
    default:
      throw new Error('Invalid mode.');
  }
}
