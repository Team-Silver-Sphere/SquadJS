<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - Discord Chat Admin Request Plugin

</div>

## About

The Discord Chat Admin Request plugin allows players to ping for an admin in discord. It can be configured to limit access to specific chats.

## Installation

```js
// Place the following two lines at the top of your index.js file.
import Discord from 'discord.js';
import { discordChatAdminRequest } from 'plugins';

// Place the following two lines in your index.js file before using an Discord plugins.
const discordClient = new Discord.Client();
await discordClient.login('Discord Login Token'); // insert your Discord bot's login token here.

// Place the following lines after all of the above.
await discordChatAdminRequest(server, discordClient, 'discordChannelID', {
  // options - the options included below display the defaults and can be removed for simplicity.
  adminPrefix: '!admin', // prefix for an admin request.
  pingGroups: ['729853701308678154'], // Groups to ping on a request, leave empty for no ping.
  ignoreChats: ['ChatSquad', 'ChatAdmin'], // an array of chats to not display.
  color: '#f44336' // color of embed
});
```
