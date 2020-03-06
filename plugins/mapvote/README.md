<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - Mapvote
</div>

## About
The mapvote plugin uses a "did you mean?" system to allow for players to vote for a wide range of layers. Command information for using the plugin in-game can be accessed by typing `!mapvote help` into in-game chat.

## Installation
Place the following into your `index.js` file. The filters / options below are optional and can be removed without affecting functionality, however, the default options are shown below for reference.
```js
mapvote(
  server,
  { // layer filter to limit layers - remove or edit the below options to adjust the filter. Leaving this blank will remove all training layers as a default.
    whitelistedLayers: ['layer name'], // an array of layers that can be played
    blacklistedLayers: ['layer name'], // an array of layers that cannot be played
    whitelistedMaps: ['map name'], // an array of maps that can be played
    blacklistedMaps: ['map name'], // an array of maps that cannot be played - default removes training maps
    whitelistedGamemodes: ['gamemode name'], // an array of gamemodes that can be played
    blacklistedGamemodes: ['gamemode name'], // an array of gamemodes that cannot be played
    flagCountMin: 4, // the minimum number of flags the layer must have
    flagCountMax: 7, // the maximum number of flags the layer must have
    hasCommander: true, // has commander enabled
    hasTanks: true, // has tanks
    hasHelicopters: true // has helicopters
  },
  { // options - remove or edit the below options. The defaults are shown.
    command: '!mapvote', // the command name used to access the vote
    layerTolerance: 4, // the number of other layers that must be played before the layer can be revoted for
    mapTolerance: 2, // the number of other maps that must be played before the layer can be revoted for
    timeTolerance: 5 * 60 * 60 * 1000 // the time that must pass before the above are ignored
  }
);
```
