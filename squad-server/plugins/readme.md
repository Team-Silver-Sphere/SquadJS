# Plugins
You can extend SquadJS by writing you own plugins. 
To create your own plugin you need a basic knowledge of JavaScript.

Plugins have to use the file extension `.squad.js` and should extend the [BasePlugin](./base-plugin.js).
You can create base classes for your plugins by using only `.js` as file extension like [DiscordBasePlugin](./discord-base-plugin.js).
Your own base classes should extend the [BasePlugin](./base-plugin.js) also.

## Creating Your Own Plugins
Typical plugins are functions that take the server as an argument in order to allow the plugin to access information about the server or manipulate it in some way:
```js
function aPluginToLogServerID(server){
  console.log(server.id);
}
```

Stored in the server object are a range of different properties that store information about the server.
 * `id` - ID of the server.
 * `serverName` - Name of the server.
 * `maxPlayers` - Maximum number of players on the server.
 * `publicSlots` - Maximum number of public slots.
 * `reserveSlots` - Maximum number of reserved slots.
 * `publicQueue` - Length of the public queue.
 * `reserveQueue` - Length of the reserved queue.
 * `matchTimeout` - Time until match ends?
 * `gameVersion` - Game version.
 * `layerHistory` - Array history of layers used with most recent at the start. Each entry is an object with layer info in.
 * `currentLayer` - The current layer.
 * `nextLayer` - The next layer.
 * `players` - Array of players. Each entry is a PlayerObject with various bits of info in.

One approach to making a plugin would be to run an action periodically, in the style of the original SquadJS:
```js
function aPluginToLogPlayerCountEvery60Seconds(server){
  setInterval(() => {
    console.log(server.players.length);
  }, 60 * 1000);
}
```

A more common approach in this version of SquadJS is to react to an event happening:
```js
function aPluginToLogTeamkills(server){
  server.on('TEAMKILL', info => {
    console.log(info);
  });
}
```
Various actions can be completed in a plugin. Most of these will involve outside system, e.g. Discord.js to run a Discord bot, so they are not documented here. However, you may run RCON commands using `server.rcon.execute("Command");`.

If you're struggling to create a plugin, the existing [`plugins`](https://github.com/Team-Silver-Sphere/SquadJS/tree/master/plugins) are a good place to go for examples or feel free to ask for help in the Squad RCON Discord. 