<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - Map Vote
</div>

## Map Vote "Did you mean?"
### About
Map Vote "Did you mean?" is best suited for servers who wish to allow players to vote for any layer in a large pool of options as it allows players to vote by specifying the layer name in chat. It uses a "did you mean?" algorithm to correct misspelling in layer names making it easier for players to vote.

Commands:
 * `!mapvote help` - Shows other commands players can use.
 * `!mapvote results` - See the map vote results.
 * `!mapvote <layer name>` - Vote for a specific layer. Misspelling will be corrected where possible.
 
 
 * `!mapvote start` (Admin chat only) - Starts a new map vote.
 * `!mapvote restart` (Admin chat only) - Restarts a map vote.
 * `!mapvote end` (Admin chat only) - Ends a map vote and announces the winner.
 * `!mapvote destroy` (Admin chat only) - End a map vote without announcing the winner.

### Installation
Add the following two lines at the top of your index.js file to import the required components:
```js
import SquadLayerFilter from 'connectors/squad-layer-filter';
import { mapvote } from 'plugins';
```

To control which constraints, e.g. map history and player count compliant, you need to create an active layer filter.
```js
const activeLayerFilter = {
    historyResetTime: 5 * 60 * 60 * 1000, // after 5 hours the layer history is ignored. null if off
    layerHistoryTolerance: 8, // a layer can be only played once every x layers. null if off
    mapHistoryTolerance: 4, // a map can only be played once every x layers. null if off
    gamemodeHistoryTolerance: {
      Invasion: 4 // invasion can only be played once every x layers
      // if not specified they will default to off
    },
    gamemodeRepetitiveTolerance: {
      Invasion: 4 // invasion can only be played up to x times in a row
      // if not specified they will default to off
    },
    playerCountComplianceEnabled: true, // filter layers based on suggested player counts if true
    factionComplianceEnabled: true, // a team cannot play the same faction twice in a row
    factionHistoryTolerance: {
      RUS: 4 // rus can only be played once every x layers
      // if not specified they will default to off
    },
    factionRepetitiveTolerance: {
      RUS: 4 // rus can only be played up to x times in a row
      // if not specified they will default to off
    },
};
```

You can turn off all options with:
```js
const activeLayerFilter = null;
```

Create a layer pool with one of the following options:
```js
// from a list
const squadLayerFilter = SquadLayerFilter.buildFromFilter(['Layer name 1', 'layer name 2'], activeLayerFilter);

// from a file of layer anmes separated by new lines
const squadLayerFilter = SquadLayerFilter.buildFromFile('filename', activeLayerFilter);

// from a filter
const squadLayerFilter = SquadLayerFilter.buildFromFilter(
  { // these options can also be turned off by replacing the value with null
    whitelistedLayers: null, // a list of layers that can be played
    blacklistedLayers: null, // a list of layers that cannot be played
    whitelistedMaps: null, // a list of maps that can be played
    blacklistedMaps: null, // a list of maps that cannot be played
    whitelistedGamemodes: null, // a list of gamemodes that can be played
    blacklistedGamemodes: ['Training'], // a list of gamemodes that cannot be played
    flagCountMin: null, // layers must have move than this number of flags
    flagCountMax: null, // layers must have less than this number of flags
    hasCommander: null, // layer must have a commander
    hasTanks: null, // layer must have tanks
    hasHelicopters: null // layer must have helicopters
  },
  activeLayerFilter
);
```

Setup the map vote plugin:
```js
mapvote(
  server, 
  'didyoumean', 
  squadLayerFilter, 
  {
    alwaysOn: true, // map vote will start without admin interaction if true
    minPlayerCount: null, // this number of players must be online before they can vote. null is off
    minVoteCount: null, // this number of votes must be counted before a layer is selected. null is off
  }
);
```

## Map Vote "123"
### About
Map Vote "123" is best suited for servers who want to allow admins to create map votes that allow players to easily choose from a small selection of layers.

Commands:
 * `!mapvote help` - Shows other commands players can use.
 * `!mapvote results` - See the map vote results.
 * `<layer number>` - Vote for a specific layer via it's associated number.
 
 
 * `!mapvote start <layer name 1>, <layer name 2>` (Admin chat only) - Starts a new map vote.
 * `!mapvote restart` (Admin chat only) - Restarts a map vote with the same layers.
 * `!mapvote end` (Admin chat only) - Ends a map vote and announces the winner.
 * `!mapvote destroy` (Admin chat only) - End a map vote without announcing the winner.

### Installation
Add the following two lines at the top of your index.js file to import the required components:
```js
import SquadLayerFilter from 'connectors/squad-layer-filter';
import { mapvote } from 'plugins';
```

Setup the map vote plugin:
```js
mapvote(
  server, 
  '123', 
  {
    minVoteCount: null, // this number of votes must be counted before a layer is selected. null is off
  }
);
```
