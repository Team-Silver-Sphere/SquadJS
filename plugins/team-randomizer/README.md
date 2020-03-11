<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - Team Randomizer
</div>

## About
The team randomizer randomly moves players to a team either immediately or upon map change.

Commands (in admin chat):
 * `!randomize on` - Turn it on for next map change.
 * `!randomize off` - Turn it off for next map change.
 * `!randomize now` - Run now.

## Installation
Place the following into your `index.js` file. The options below are optional and can be removed without affecting functionality, however, the default options are shown for reference.
```js
teamRandomizer(
  server,
  { // options - remove or edit the below options. The defaults are shown.
    command: '!randomize', // the command name used to access the feature
  }
);
```
