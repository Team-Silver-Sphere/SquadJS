<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - Team Randomizer
</div>

## About
The team randomizer randomly moves players to a team when `!randomize` is called in admin chat.

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
