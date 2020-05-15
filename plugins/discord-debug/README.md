<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - Discord Debug
</div>

## About
The Discord Debug plugin logs all server events in a raw format for monitoring/debugging/testing purposes.

## Installation
```js
// Place the following two lines at the top of your index.js file.
import Discord from 'discord.js';
import { discordDebug } from 'plugins';

// Import the events you wish to log in your index.js file. A full list can be found in the directory specified below.
import {
  LOG_PARSER_PLAYER_CONNECTED,
  LOG_PARSER_PLAYER_WOUNDED,
} from 'squad-server/events/log-parser';

// Place the following two lines in your index.js file before using an Discord plugins.
const discordClient = new Discord.Client();
await discordClient.login('Discord Login Token'); // insert your Discord bot's login token here.

// Place the following lines after all of the above.
await discordDebug(
  server,
  discordClient,
  'discordChannelID', 
  [LOG_PARSER_PLAYER_CONNECTED, LOG_PARSER_PLAYER_WOUNDED] // List the events you wish to log.
); 
```
