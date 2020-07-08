<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - Discord Server Status
</div>

## About
Display a server status embed that can be updated by clicking the refresh react.

## Installation
```js
// Place the following two lines at the top of your index.js file.
import Discord from 'discord.js';
import { discordServerStatus } from 'plugins';

// Place the following two lines in your index.js file before using an Discord plugins.
const discordClient = new Discord.Client();
await discordClient.login('Discord Login Token'); // insert your Discord bot's login token here.

// Place the following lines after all of the above.
await discordServerStatus(
  server,
  discordClient,
  { // options - the options included below display the defaults and can be removed for simplicity.
    color: 16761867, // color of embed
    colorGradient: true, // gradient color based on player count
    connectLink: true, // show Steam connect link
    command: '!server', // command used to send message
    disableStatus: false // disable bot status as server status
  }
); 
```
