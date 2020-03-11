import { RCON_CHAT_MESSAGE } from 'squad-server/events/rcon';
import { SERVER_LAYER_CHANGE } from 'squad-server/events/server';

function shuffle(array) {
  let currentIndex = array.length;
  let temporaryValue;
  let randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

async function randomize(server) {
  const players = server.players.slice(0);
  shuffle(players);

  let team = '1';

  for (const player of players) {
    if (player.teamID !== team) {
      await server.rcon.execute(`AdminForceTeamChange "${player.steamID}"`);
    }

    team = team === '1' ? '2' : '1';
  }
}

export default function(server, options = {}) {
  if (!server)
    throw new Error('Mapvote must be provided with a reference to the server.');

  const command = options.command || '!randomize';
  const commandRegex = new RegExp(`^${command} (on|off|now)`, 'i');

  let on = false;

  server.on(RCON_CHAT_MESSAGE, info => {
    if (info.chat !== 'ChatAdmin') return;

    const match = info.message.match(commandRegex);
    if (!match) return;

    if (match[1] === 'now') {
      randomize();
      on = false;
    } else {
      on = match[1] === 'on';
    }
  });

  server.on(SERVER_LAYER_CHANGE, () => {
    if (on === true) randomize();
    on = false;
  });
}
