import DiscordBasePlugin from './discord-base-plugin.js';

export default class ttVote extends DiscordBasePlugin {
  static get description() {
    return (
      'The <code>tt-vote</code> plugin provides complex voting functionality:\n' +
      '\n\n' +
      ' * <code>Simple Voting</code> - Admins can specify a simple vote in addition to map voting \n' +
      ' * <code>Mapvote Command Parsing</code> - Admins can specify a mix of layers, modes, or other "search" terms when specifying a mapvote quickly and simply \n' +
      ' * <code>Layer Deduplication by base map</code> - Layers for the next vote take into account recently played maps, and will attempt to exclude layers sharing the base map. \n' +
      ' * <code>Double Invasion Limiting</code> - Invasion can be filtered out if recently played, stopping back to back invasion games, this is configurable \n' +
      ' * <code>Limit CAF_ Layers to one option per vote</code> - CAF has many more layers than any other faction, leading to a bias in random selection toward CAF \n' +
      ' * <code>Mod Support</code> - This plugin uses RCON to get a list of layers, so Modded layers should automatically appear in votes. ' +
      ' Simply add the Mod Prefix in your config file, this will help attempt dedpulicating modded layers by base map \n' +
      ' * <code>Layer/Mode whitelisting</code> - Simple search terms can be filter the map pool, allowing ease of selecting specific mod/Gamemode only vote options\n' +
      ' * <code>Layer/Mode Blacklisting</code> - Simple search terms can be filtered out of the map pool, useful for eliminating maps/modes from vote options\n' +
      'Once a vote is in progress it either must end, or be canceled before starting another vote \n' +
      'During a vote, every 30 seconds the options are Broadcast to the server \n' +
      'Automatically Sets Nextmap \n' +
      'Players vote via sending a matching number in any chat \n ' +
      '\n\n' +
      'Player Commands:\n' +
      ' * <code>Number</code> - Vote for a layer using the layer number.\n' +
      '\n\n' +
      'Admin Commands (Admin Chat Only):\n' +
      ' * <code>!mapvote</code> - Start a new map vote with 3 random maps.\n' +
      ' * <code>!mapvote aas inv raas </code> \n' +
      ' * <code>!mapvote yeho:raas narva:tc goro:inv</code> - End the map vote and announce the winner.\n' +
      ' * <code>!vote option1 option2 option 3</code> - Simple vote for anythin besides maps (Admin must set whatever options)\n' +
      ' * <code>!cancelvote</code> - Cancel the currently running vote, without totaling the ballots\n' +
      ' * <code>!endvote</code> - End a vote Early, Totalling the ballots.\n'
    );
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelID: {
        required: true,
        description: 'The ID of the channel to log vote broadcasts to.',
        default: '',
        example: '667741905228136459'
      },
      voteTime: {
        required: false,
        description: 'The amount of time for players to vote in seconds.',
        default: null,
        example: 120
      },
      ignoreChats: {
        required: true,
        description: 'The chat channels to ignore.',
        default: null,
        example: ['ChatAll']
      },
      blacklist: {
        required: true,
        description: 'Layers, Modes, and Words to remove',
        default: ['insurgency', 'jensens', 'destruction'],
        example: ['caf_', 'insurgency', 'jensens', 'destruction']
      },
      whitelist: {
        required: true,
        description: 'Layers, Modes, and Words to restrict options to',
        default: [],
        example: ['RAAS']
      },
      layerHistoryLimit: {
        required: true,
        description:
          'The set of previous maps to exclude layers from the next vote, stops repeated short rotations',
        default: 0,
        example: 2
      },
      allowMultipleCAF: {
        required: false,
        description: 'if each set of layer options should attempt to only have a single CAF layer',
        default: true,
        example: true
      },
      disallowRepeatedInvasion: {
        required: false,
        description: 'Attempt to limit Invasion if recently played in map History',
        default: true,
        example: true
      },
      layerPrefixes: {
        required: true,
        description: 'Map Prefixes from Mods or DLC, used to filter out base maps',
        default: ['CAF_'],
        example: ['CAF_', 'BAL_', 'GC_', 'HLP_', 'HRR_']
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onChatMessage = this.onChatMessage.bind(this);
    this.onNewGame = this.onNewGame.bind(this);
    this.tallyVotes = this.tallyVotes.bind(this);
    this.callVote = this.callVote.bind(this);
    this.parseVoteParams = this.parseVoteParams.bind(this);
    this.getLayerOptions = this.getLayerOptions.bind(this);
    this.checkAndRemovePrefix = this.checkAndRemovePrefix.bind(this);
    this.clearVote = this.clearVote.bind(this);
    this.mapvote = false;
    this.voteInProgress = false;
    this.ballotBox = new Map();
    this.voteOptions = [];
  }

  async mount() {
    this.server.on('CHAT_MESSAGE', this.onChatMessage);
    this.server.on('NEW_GAME', this.onNewGame);
    // NEW GAME is unreliable with mods.
  }

  async unmount() {
    this.server.on('CHAT_MESSAGE', this.onChatMessage);
    this.server.on('NEW_GAME', this.onNewGame);
  }

  async onNewGame(info) {
    this.clearVote();
    clearInterval(this.voteBroadcast);
    clearInterval(this.voteTimeout);
  }

  async onChatMessage(info) {
    this.info = info;

    // EXIT IF VOTE IN PROGRESS
    if (
      this.voteInProgress &&
      (info.message.toLowerCase().startsWith('!vote') ||
        info.message.toLowerCase().startsWith('!mapvote')) &&
      !this.options.ignoreChats.includes(info.chat)
    ) {
      await this.server.rcon.warn(
        info.steamID,
        'Vote already in progress. Type !cancelvote or !endvote to end the vote early'
      );
      return;
    }

    // START A VOTE
    if (
      !this.voteInProgress &&
      info.message.toLowerCase().startsWith('!vote') &&
      !this.options.ignoreChats.includes(info.chat)
    ) {
      this.voteOptions = info.message.slice(6, info.message.length).match(/[A-z0-9:]+/g);
      if (!this.voteOptions || this.voteOptions.length < 2) {
        await this.server.rcon.warn(info.steamID, 'Please input at least two vote options.');
        return;
      }

      this.callVote(this.voteOptions);
    }

    // Start a mapvote
    if (
      !this.voteInProgress &&
      info.message.toLowerCase().startsWith('!mapvote') &&
      !this.options.ignoreChats.includes(info.chat)
    ) {
      // Default case of !mapvote with no args
      if (info.message.toLowerCase() === '!mapvote') {
        this.mapvote = true;
        this.voteOptions = await this.getLayerOptions();
        await this.callVote(this.voteOptions);
        return;
      }

      // Otherwise...
      const params = this.parseVoteParams(
        info.message
          .slice(9, info.message.length)
          .toLowerCase()
          .match(/[a-z0-9:]+/g)
      );
      if (params.length < 2 || params.length > 4) {
        await this.server.rcon.warn(info.steamID, 'Please input between 2-4 vote options.');
        return;
      }
      this.voteOptions = await this.getLayerOptions(params);
      if (params.length !== this.voteOptions.length) {
        await this.server.rcon.warn(
          info.steamID,
          'Vote Cancelled, perhaps one of maps/modes you tried to select was recently played or blacklisted?'
        );
        return;
      }
      this.mapvote = true;
      await this.callVote(this.voteOptions);
    }

    // End a vote, counting totals
    if (
      this.voteInProgress &&
      info.message.toLowerCase().startsWith('!endvote') &&
      !this.options.ignoreChats.includes(info.chat)
    ) {
      clearTimeout(this.voteTimeout);
      clearInterval(this.voteBroadcast);
      await this.tallyVotes();
      return;
    }
    // Cancel a Vote, No Totals
    if (
      this.voteInProgress &&
      info.message.toLowerCase().startsWith('!cancelvote') &&
      !this.options.ignoreChats.includes(info.chat)
    ) {
      this.clearVote();
      clearTimeout(this.voteTimeout);
      clearInterval(this.voteBroadcast);

      await this.server.rcon.warn(info.steamID, 'Vote Cancelled');
      await this.server.rcon.broadcast(`Server: Vote Has Been Canceled by an Admin`);

      return;
    }

    // PLAYER VOTES HERE
    if (this.voteInProgress && info.message.match(/^[0-9]+/)) {
      const optionIndex = parseInt(info.message) - 1;
      if (optionIndex > this.voteOptions.length - 1 || optionIndex < 0) {
        await this.server.rcon.warn(info.steamID, `That is not a valid option. Please try again.`);
        return;
      }
      if (!this.ballotBox.has(info.steamID)) {
        await this.server.rcon.warn(
          info.steamID,
          `You have voted for ${this.voteOptions[optionIndex]}.`
        );
      } else {
        await this.server.rcon.warn(
          info.steamID,
          `You have changed your vote to ${this.voteOptions[optionIndex]}.`
        );
      }
      this.ballotBox.set(info.steamID, optionIndex);
    }
  }

  async tallyVotes() {
    let max = 0;
    let winner = '';

    const totals = [];
    let tie = false;
    clearInterval(this.voteBroadcast);

    for (const player of this.ballotBox) {
      if (totals[player[1]] === undefined) {
        totals[player[1]] = 1;
      } else {
        totals[player[1]]++;
      }
    }

    for (let i = 0; i < this.voteOptions.length; i++) {
      if (totals[i] === undefined) {
        totals[i] = 0;
      }
      if (totals[i] === max) {
        tie = true;
      }
      if (totals[i] > max) {
        tie = false;
        winner = this.voteOptions[i];
        max = totals[i];
      }
    }

    const totalsStr = totals
      .map((value, index) => `${this.voteOptions[index]}: ${value} votes,`)
      .join(' ')
      .slice(0, -1);
    if (tie) {
      await this.server.rcon.broadcast(
        `Server: There has been a tie! Total votes: ${this.ballotBox.size}.\n${totalsStr}`
      );
    } else {
      await this.server.rcon.broadcast(
        `Server: ${winner} has won the vote! Total votes: ${this.ballotBox.size}.\n${totalsStr}`
      );
    }

    const message = {
      content: `\`\`\`fix\nVote has ended.\nTotal votes: ${this.ballotBox.size}.\n${totalsStr}\n\`\`\``
    };
    await this.channel.send(message);
    if (this.mapvote === true && winner) {
      await this.server.rcon.execute(`AdminSetNextLayer ${winner}`);
    }
    this.clearVote();
  }

  // So I heard you like String Parsing?
  async callVote(options) {
    this.voteInProgress = true;

    const broadcastStr = options.map((option, index) => `${index + 1}: ${option}`).join(' ');

    const message = {
      content: `\`\`\`fix\n${this.info.player.name} has started a vote: ${broadcastStr}\n\`\`\``
    };
    await this.channel.send(message);

    await this.server.rcon.broadcast(
      `Server: A vote has started! Enter a number to vote!\n${broadcastStr}`
    );
    this.voteBroadcast = setInterval(async () => {
      await this.server.rcon.broadcast(
        `Server: A vote is in progress! Enter a number to vote!\n${broadcastStr}\nTotal votes: ${this.ballotBox.size}`
      );
    }, 30 * 1000);

    this.voteTimeout = setTimeout(this.tallyVotes, this.options.voteTime * 1000);
  }

  async getLayers() {
    let Layers = await this.server.rcon.getListLayers();

    for (const word of this.options.blacklist) {
      if (word.toLowerCase() === 'aas') {
        Layers = this.filterLayersByPattern(Layers, 'raas', false);
      }
      Layers = this.filterLayersByPattern(Layers, word.toLowerCase(), false);
    }

    for (const word of this.options.whitelist) {
      if (word.toLowerCase() === 'aas') {
        Layers = this.filterLayersByPattern(Layers, 'raas', false);
      }
      Layers = this.filterLayersByPattern(Layers, word);
    }

    // Remove Recently Played Base maps
    // this can blow up if layerHistory Contains Null or Undefined..
    // But the likey should happen inside of the server index.js,
    for (const layer of this.server.layerHistory.slice(0, this.options.layerHistoryLimit - 1)) {
      if (this.options.disallowRepeatedInvasion) {
        if (
          this.server.layerHistory.filter((layer) => layer.layer.classname.includes('invasion'))
        ) {
          Layers = this.filterLayersByPattern(Layers, 'invasion', false);
        }
      }

      Layers = this.filterLayersByPattern(
        Layers,
        this.checkAndRemovePrefix(layer.layer.classname),
        false
      );
    }
    return Layers;
  }

  parseVoteParams(options) {
    if (options === null) {
      return;
    }

    const patterns = [];
    for (const option of options.map((option) => option.toLowerCase())) {
      // Parse search pattners.
      // yeho:aas:v1 => [yeho, aas, v1]

      // Shift more specific options to front of search patterns
      // This is done so less specific options don't collide and cause a search failure
      // aas aas yeho:aas => yeho:aas aas aas
      if (option.includes(':')) {
        patterns.unshift(option.split(':'));
      } else {
        patterns.push([option]);
      }
    }

    return patterns;
  }

  async getLayerOptions(params) {
    const selectedLayers = [];
    let Layers = await this.getLayers();

    // Default Case, "!mapvote" no options
    if (!params) {
      for (let x = 0; x < 3; x++) {
        const selectedLayer = Layers[Math.floor(Math.random() * Layers.length)];

        if (selectedLayer.includes('CAF_')) {
          if (this.options.allowMultipleCAF === false) {
            Layers = this.filterLayersByPattern(Layers, 'CAF_', false);
          }
        }

        Layers = this.filterLayersByPattern(
          Layers,
          this.checkAndRemovePrefix(selectedLayer),
          false
        );

        selectedLayers.push(selectedLayer);
      }

      return selectedLayers;
    }

    //! mapvote option:sub option....

    for (const param of params) {
      let candidateLayers = Layers;

      // Remove exact Duplicate Layers
      candidateLayers = candidateLayers.filter((Layer) => !selectedLayers.includes(Layer));

      for (const p of param) {
        // Remove RAAS from AAS
        if (p === 'aas') {
          candidateLayers = this.filterLayersByPattern(candidateLayers, 'raas', false);
        }
        candidateLayers = this.filterLayersByPattern(candidateLayers, p);
      }

      const selectedLayer = candidateLayers[Math.floor(Math.random() * candidateLayers.length)];

      if (selectedLayer) {
        selectedLayers.push(selectedLayer);

        if (selectedLayer.includes('CAF_')) {
          if (this.options.allowMultipleCAF === false) {
            Layers = this.filterLayersByPattern(Layers, 'CAF_', false);
          }
        }
        // we need to selectively filter the layers
        // if our search params is a single option, remove the same base map
        // Do not Remove Duplicates on Advanced Search
        // We want admins to be able to specify 3 of a layer
        // 'yeho:ass yeho:raas yeho:inv'
        if (param.length === 1) {
          Layers = this.filterLayersByPattern(
            Layers,
            this.checkAndRemovePrefix(selectedLayer),
            false
          );
        }
      }
    }
    if (selectedLayers.length !== params.length) {
      // Warn And Cancel Vote?
    }

    return selectedLayers;
  }

  filterLayersByPattern(Layers, Pattern, match = true) {
    if (match) {
      return Layers.filter((Layer) => Layer.toLowerCase().includes(Pattern.toLowerCase()));
    }
    return Layers.filter((Layer) => !Layer.toLowerCase().includes(Pattern.toLowerCase()));
  }

  checkAndRemovePrefix(layer) {
    for (const prefix of this.options.layerPrefixes) {
      if (layer.toLowerCase().startsWith(prefix.toLowerCase())) {
        return layer
          .toLowerCase()
          .replace(/_/g, '')
          .slice(prefix.length - 1, prefix.length + 4);
      }
    }
    return layer.toLowerCase().replace(/_/g, '').slice(0, 5);
  }

  clearVote() {
    this.mapvote = false;
    this.voteInProgress = false;
    this.ballotBox = new Map();
    this.voteOptions = [];
  }
}
