import DiscordBasePlugin from './discord-base-plugin.js';

export default class SquadBaiting extends DiscordBasePlugin {
    static get description() {
        return "Squad Baiting plugin";
    }

    static get defaultEnabled() {
        return true;
    }

    static get optionsSpecification() {
        return {
            ...DiscordBasePlugin.optionsSpecification,
            channelID: {
                required: true,
                description: 'The ID of the channel to log admin broadcasts to.',
                default: '',
                example: '667741905228136459'
            },
            warnInGameAdmins: {
                required: false,
                default: true,
                description: ''
            },
            resetPlayerCountersAtNewGame: {
                required: false,
                default: true,
                description: ''
            },
            disableDefaultAdminWarns: {
                required: false,
                default: false,
                description: ''
            },
            roleChangeTriggersSquadBaiting: {
                required: false,
                default: true,
                description: 'Applies only when switching to a non-SL kit, only during early squad baiting rule time window'
            },
            detectEarlySquadbaitingMinutes: {
                required: false,
                default: 1,
                description: 'How many minutes from squad creation time can trigger early squadbaiting detection (not rule enforcing)'
            },
            enforceEarlySquadBaitingAfterSeconds: {
                required: false,
                default: 30,
                description: 'How many seconds from the detection of early squadbaiting can pass before triggering early squadbaiting rules'
            },
            ignoreClansMates: {
                required: false,
                default: true,
                description: 'Avoid squad baiting detection if the first 3 characters of the old and new squad leader names match.'
            },
            playerRules: {
                required: false,
                default: [],
                description: 'Set of rules that will be applied on player events',
                example: [
                    {
                        name: 'Friendly and human-readable name',
                        enabled: true,
                        baitingCounter: {
                            min: 0,
                            max: 10
                        },
                        actions: [
                            {
                                type: 'rcon',
                                content: 'AdminWarn {}'
                            }
                        ]
                    }
                ]
            },
            playerThreshold: {
                required: false,
                default: 60,
                description: 'will not run the checks if player count is below the threshold'
            },
            squadRules: {
                required: false,
                default: [],
                description: 'Set of rules that will be applied on squad events',
                example: [
                    {
                        name: 'Martian-readable name',
                        enabled: true,
                        baitingCounter: {
                            min: 5,
                            max: Infinity
                        },
                        actions: [
                            {
                                type: 'rcon',
                                content: 'AdminWarn {}'
                            }
                        ]
                    }
                ]
            },
            earlySquadBaitingRules: {
                required: false,
                default: [],
                description: 'Set of rules that will be applied on squadbaiting events happened during the first minute since squad creation',
                example: [
                    {
                        name: 'Martian-readable name',
                        enabled: true,
                        actions: [
                            {
                                type: 'rcon',
                                content: 'AdminWarn {}'
                            }
                        ]
                    }
                ]
            }
        };
    }

    constructor(server, options, connectors) {
        super(server, options, connectors);

        this.onSquadCreated = this.onSquadCreated.bind(this)
        this.warnAdmins = this.warnAdmins.bind(this)
        this.onSquadBaiting = this.onSquadBaiting.bind(this)
        this.formatActionContent = this.formatActionContent.bind(this)
        this.onPlayerDisconnected = this.onPlayerDisconnected.bind(this);
        this.onPlayerConnected = this.onPlayerConnected.bind(this);
        this.onNewGame = this.onNewGame.bind(this);
        this.resetPlayerCounters = this.resetPlayerCounters.bind(this);
        this.sendDiscordRuleLog = this.sendDiscordRuleLog.bind(this);
        this.getSquads = this.getSquads.bind(this);
        // this.discordLog = this.discordLog.bind(this)

        this.playerBaiting = new Map();
        this.squadsBaiting = new Map();
        this.squadsLeaderHistory = new Map();
        this.squadsCreationTime = new Map();
        this.earlySquadBaitingMarkedSquads = new Map();
        this.lastRoleChange = new Map();

        this.broadcast = (msg) => { this.server.rcon.broadcast(msg); };
        this.warn = (steamid, msg) => { this.server.rcon.warn(steamid, msg); };
    }

    async mount() {
        this.server.on('SQUAD_CREATED', this.onSquadCreated);
        this.server.on('PLAYER_DISCONNECTED', this.onPlayerDisconnected);
        this.server.on('PLAYER_CONNECTED', this.onPlayerConnected);
        this.server.on('NEW_GAME', this.onNewGame);

        let oldSquads = [];

        setInterval(async () => {
            if (this.server.players.length < this.options.playerThreshold) return;
            this.verbose(1, `Players: ${this.server.players.length}/${this.options.playerThreshold}`)

            const playerRegex = /ID: ([0-9]+) \| Online IDs: EOS: (?<eosID>[0-9a-f]{32}) steam: (?<steamID>\d{17}) \| Name: (?<name>.*?) \| Team ID: (?<teamID>[0-9]+) \| Squad ID: (?<squadID>[0-9]+|N\/A) \| Is Leader: (?<isLeader>True|False) \| Role: (?<role>[^\s]*)/;
            const players = (await this.server.rcon.execute('ListPlayers')).split('\n').map(e => playerRegex.exec(e)?.groups).filter(e => e != null);

            const newSquads = (await this.getSquads()).map(e => ({
                ...e,
                leader: players.find(p => p.squadID == e.squadID && p.teamID == e.teamID && p.isLeader == 'True'),
                players: players.filter(p => p.squadID == e.squadID && p.teamID == e.teamID),
                sqUid: `${e.teamID};${e.squadID};${e.squadName};${e.creatorEOSID}`
            }));
            oldSquads.forEach(async s => {
                // this.verbose(1, 'Squad info', s)
                const sqUid = s.sqUid;
                const match = newSquads.find(ns => ns.sqUid == s.sqUid)

                if (!match) {
                    this.verbose(1, `Early squad baiting reset for: ${sqUid}. OLD-LEADER: ${s.leader.name}. Due to squad being disbanded`)
                    this.earlySquadBaitingMarkedSquads.delete(sqUid)
                    this.squadsBaiting.delete(sqUid)
                    return;
                }

                const earlySquadBaitingDetected = (Date.now() - +this.squadsCreationTime.get(sqUid) < this.options.detectEarlySquadbaitingMinutes * 60 * 1000);
                const squadEearlySquadBaiting = this.earlySquadBaitingMarkedSquads.get(sqUid);

                if (squadEearlySquadBaiting && Date.now() - +squadEearlySquadBaiting > this.options.enforceEarlySquadBaitingAfterSeconds * 1000) {
                    if (!match.leader.role.match(/SL/i))
                        this.onSquadBaiting(s, match, sqUid, true);
                    else {
                        this.earlySquadBaitingMarkedSquads.delete(sqUid)
                        this.verbose(1, `Early squad baiting reset for: ${sqUid}. CURRENT-LEADER: ${match.leader.name}`)
                        return;
                    }
                }

                const clanMatesInitialCharsCount = 3
                const leadersAreClanMates = s.leader.name.slice(0, clanMatesInitialCharsCount) == match.leader.name.slice(0, clanMatesInitialCharsCount)

                const roleChanged = this.options.roleChangeTriggersSquadBaiting && earlySquadBaitingDetected && !match.leader.role.match(/SL/i) && !!s.leader.role.match(/SL/i) && match.leader.eosID == s.leader.eosID;
                const leaderChanged = match.leader.eosID != s.leader.eosID && match.players.length > 1 && (!leadersAreClanMates && this.options.ignoreClansMates);
                const baiting = match && (leaderChanged || roleChanged) && !s.squadName.match(/admin/i);

                if (s.squadName.match(/TEST/i)) {
                    this.verbose(1, 'Baiting Check', sqUid, s.leader.name, `ROLE-CHANGED-OPTION: ${this.options.roleChangeTriggersSquadBaiting} - EARLY-SBAITING: ${earlySquadBaitingDetected} - ROLE-CHANGED: ${roleChanged} - LEADER-CHANGED: ${leaderChanged} - SQUAD-AGE-SECONDS: ${(Date.now() - +this.squadsCreationTime.get(sqUid)) / 1000} - CUR-ROLE: ${match.leader.role} - OLD-ROLE: ${s.leader.role}`)
                    if (roleChanged)
                        this.warn(s.leader.eosID, 'You changed role')
                }
                if (baiting) {
                    if (earlySquadBaitingDetected && !this.earlySquadBaitingMarkedSquads.get(sqUid)) {
                        this.earlySquadBaitingMarkedSquads.set(sqUid, Date.now());
                        const squadbaitingSecondsAfterSquadCreation = Math.round((Date.now() - +this.squadsCreationTime.get(sqUid)) / 1000)
                        this.warn(match.leader.eosID, `You have ${this.options.enforceEarlySquadBaitingAfterSeconds} seconds to equip a SQUAD LEADER role\nSquad baiting happened ${squadbaitingSecondsAfterSquadCreation} seconds after squad creation.`);
                    }

                    const plBaitingAmount = (this.playerBaiting.get(s.leader.steamID) || 0) + 1;
                    this.playerBaiting.set(s.leader.steamID, plBaitingAmount)

                    const sqBaitsAmount = (this.squadsBaiting.get(sqUid) || 0) + 1;
                    this.squadsBaiting.set(sqUid, sqBaitsAmount)

                    if (!this.squadsLeaderHistory.get(sqUid)) this.squadsLeaderHistory.set(sqUid, [])

                    if (this.squadsLeaderHistory.get(sqUid).at(-1)?.steamID != s.leader.steamID)
                        this.squadsLeaderHistory.get(sqUid).push(s.leader)

                    s.baitingCounter = sqBaitsAmount
                    s.leader.baitingCounter = plBaitingAmount

                    this.onSquadBaiting(s, match, sqUid)
                }
            })

            oldSquads = [ ...newSquads ];
        }, 5000)
    }

    onSquadCreated(info) {
        this.verbose(1, "Squad Created:", info.player.teamID, info.player.squadID)
        const sqUid = `${info.player.teamID};${info.squadID};${info.squadName};${info.player.eosID}`;
        this.squadsCreationTime.set(sqUid, new Date());

        if (!this.squadsLeaderHistory.get(sqUid)) this.squadsLeaderHistory.set(sqUid, [])
        else this.squadsLeaderHistory.set(sqUid, [])
        this.squadsLeaderHistory.get(sqUid).push({
            steamID: info.player.steamID,
            name: info.player.name
        })

        if (this.earlySquadBaitingMarkedSquads.get(sqUid)) this.earlySquadBaitingMarkedSquads.delete(sqUid)
    }

    async unmount() {
        this.verbose(1, 'Un-mounted.');
    }

    async warnAdmins(message) {
        const admins = await this.server.getAdminsWithPermission('canseeadminchat');
        if (!this.options.warnInGameAdmins) return;
        for (const player of this.server.players) {
            if (!admins.includes(player.steamID)) continue;

            await this.warn(player.steamID, message);
        }
    }

    async warnSquadMembers(squad, message) {
        squad.players.forEach(p => {
            this.warn(p.steamID, message);
        })
    }

    async onSquadBaiting(oldSquad, newSquad, sqUid, isEarlySquadBaiting = false) {
        // this.verbose(1, 'Squad baiting', oldSquad, newSquad)
        // await this.warn(oldSquad.leader.steamID, 'Squad baiting is not allowed!')
        if (!this.options.disableDefaultAdminWarns) await this.warnAdmins(`[${oldSquad.leader.name}] is doing squad baiting.\n  Player's baits: ${oldSquad.leader.baitingCounter}\n\n  Squad Info:\n   Name: ${oldSquad.squadName}\n   Number: ${oldSquad.squadID}\n   Team: ${oldSquad.leader.role.split('_')[ 0 ]} (${oldSquad.teamID})\n   Baits: ${oldSquad.baitingCounter}`)

        // let earlySquadBaitingRulesActive = false
        // if (
        //     Date.now() - +this.squadsCreationTime.get(sqUid) < this.options.detectEarlySquadbaitingMinutes * 60 * 1000
        //     && !newSquad.leader.role.match(/SL/i)
        //     && Date.now() - +this.earlySquadBaitingMarkedSquads.get(sqUid) > this.options.enforceEarlySquadBaitingAfterSeconds * 1000
        // ) {
        //     earlySquadBaitingRulesActive = true

        // }

        const activePlayerRules = isEarlySquadBaiting ? [] : this.options.playerRules.filter(r => r.enabled && r.baitingCounter.min <= oldSquad.leader.baitingCounter && r.baitingCounter.max >= oldSquad.leader.baitingCounter).map(r => ({ ...r, type: 'Player' }));
        const activeSquadRules = isEarlySquadBaiting ? [] : this.options.squadRules.filter(r => r.enabled && r.baitingCounter.min <= oldSquad.baitingCounter && r.baitingCounter.max >= oldSquad.baitingCounter).map(r => ({ ...r, type: 'Squad' }));
        const activeEarlySquadBaitingRules = isEarlySquadBaiting ? this.options.earlySquadBaitingRules.filter(r => /*earlySquadBaitingRulesActive &&*/ r.enabled).map(r => ({ ...r, type: 'Squad' })) : [];

        if (isEarlySquadBaiting) {
            const firstLeader = this.squadsLeaderHistory.get(sqUid)[ 0 ];
            oldSquad.leader.name = firstLeader.name
            oldSquad.leader.steamID = firstLeader.steamID
        }

        this.verbose(1, 'Triggered PLAYER rules', activePlayerRules.map(r => r.name))
        this.verbose(1, 'Triggered SQUAD rules', activeSquadRules.map(r => r.name))
        this.verbose(1, 'Triggered EARLY_SQUAD rules', activeEarlySquadBaitingRules.map(r => r.name))

        for (let r of activeEarlySquadBaitingRules.concat(activePlayerRules).concat(activeSquadRules)) {
            if (!r.enabled) continue;
            for (let a of r.actions.filter(act => act.enabled || act.enabled == undefined)) {
                const formattedContent = this.formatActionContent(a.content, oldSquad, newSquad);
                a.formattedContent = formattedContent
                // this.verbose(1, 'Formatted action content', formattedContent)
                switch (a.type.toLowerCase()) {
                    case 'rcon':
                        this.server.rcon.execute(formattedContent)
                        break;
                    case 'limitsl':
                        this.server.emit('LIMITSL:REQUEST', { leader: oldSquad.leader, duration: a.content || 3 }) // duration in days
                        break;
                    case 'resetcounter':
                    case 'reset-counter':
                        switch (formattedContent) {
                            case 'player':
                                this.playerBaiting.delete(oldSquad.leader.steamID)
                                break;
                            case 'squad':
                                this.squadsBaiting.delete(sqUid)
                        }
                        break;
                    case 'warn-admins':
                    case 'warnadmins':
                    case 'warn_admins':
                        this.warnAdmins(formattedContent)
                        break;
                    case 'warn-members':
                    case 'warn_members':
                    case 'warnmembers':
                        this.warnSquadMembers(newSquad, formattedContent)
                        break;
                }
            }
            this.sendDiscordRuleLog(r, oldSquad, newSquad);
        }

        if (isEarlySquadBaiting) {
            this.earlySquadBaitingMarkedSquads.delete(sqUid)
        }
    }

    async onPlayerDisconnected(info) {
        const { steamID, name: playerName, teamID } = info.player;
        // this.verbose(1, 'Disconnected', steamID, playerName, info)
        this.resetPlayerCounters(steamID)
    }
    async onPlayerConnected(info) {
        const { steamID, name: playerName, teamID } = info.player;
        this.resetPlayerCounters(steamID)
    }

    resetPlayerCounters(steamID) {
        this.playerBaiting.set(steamID, 0)
    }

    async onNewGame(info) {
        this.squadsBaiting = new Map();

        if (this.options.resetPlayerCountersAtNewGame)
            this.playerBaiting = new Map();
    }

    formatActionContent(content, oldSquad, newSquad) {
        if (typeof content == 'number') return content
        return content
            .replace(/\{squad:teamid\}/ig, oldSquad.teamID)
            .replace(/\{squad:id\}/ig, oldSquad.squadID)
            .replace(/\{squad:squadid\}/ig, oldSquad.squadID)
            .replace(/\{squad:name\}/ig, oldSquad.squadName)
            .replace(/\{squad:teamname\}/ig, oldSquad.leader.role.split('_')[ 0 ])
            .replace(/\{squad:baitingcounter\}/ig, oldSquad.baitingCounter)
            .replace(/\{old_leader:username\}/ig, oldSquad.leader.name)
            .replace(/\{old_leader:steamid\}/ig, oldSquad.leader.steamID)
            .replace(/\{old_leader:baitingcounter\}/ig, oldSquad.leader.baitingCounter)
            .replace(/\{new_leader:username\}/ig, newSquad?.leader?.name)
            .replace(/\{new_leader:steamid\}/ig, newSquad?.leader?.steamID)
            .replace(/\{new_leader:baitingcounter\}/ig, newSquad?.leader?.baitingCounter)
    }

    async sendDiscordRuleLog(rule, oldSquad, newSquad) {
        if (rule.discordLogging === false) return;
        const sqUid = oldSquad.sqUid;
        const actionsEmbedFields = rule.actions.filter(act => act.enabled || act.enabled == undefined).map(a => ({ name: a.type.toUpperCase(), value: `\`\`\`${a.formattedContent}\`\`\``, inline: false }))
        const leadersHistory = this.squadsLeaderHistory.get(sqUid).map(l => ({ name: l.name, value: `\`\`\`${l.steamID}\`\`\``, inline: true }))
        await this.sendDiscordMessage({
            embed: {
                title: `[${oldSquad.leader.name}] Squad-Baiting`,
                color: "ee1111",
                fields: [
                    ...leadersHistory,
                    // {
                    //     name: 'Leader\'s Username',
                    //     value: oldSquad.leader.name,
                    //     inline: true
                    // },
                    // {
                    //     name: 'Leader\'s SteamID',
                    //     value: `[${oldSquad.leader.steamID}](https://steamcommunity.com/profiles/${oldSquad.leader.steamID})`,
                    //     inline: true
                    // },
                    {
                        name: 'Team & Squad',
                        value: `Team: ${oldSquad.teamID}, Squad: ${oldSquad.squadID}`,
                        inline: true
                    },
                    {
                        name: 'Squad',
                        value: oldSquad.squadName,
                        inline: true
                    },
                    {
                        name: 'Team',
                        value: oldSquad.leader.role.split('_')[ 0 ],
                        inline: true
                    },
                    {
                        name: 'Triggered Rules',
                        value: rule.name,
                        inline: false
                    },
                    {
                        name: 'Executed Actions',
                        value: ':small_red_triangle_down: :small_red_triangle_down: :small_red_triangle_down: :small_red_triangle_down: :small_red_triangle_down:',
                        inline: false
                    },
                    ...actionsEmbedFields
                ],
                timestamp: (new Date()).toISOString()
            },
        });
    }

    async getSquads() {
        const responseSquad = await this.server.rcon.execute('ListSquads');

        const squads = [];
        let teamName;
        let teamID;

        for (const line of responseSquad.split('\n')) {
            const match = line.match(
                /ID: (\d+) \| Name: (.+) \| Size: (\d+) \| Locked: (True|False) \| Creator Name: (.+) \| Creator Online IDs: EOS: ([\d\w]{32}) steam: (\d{17})/
            );
            const matchSide = line.match(/Team ID: (\d) \((.+)\)/);
            if (matchSide) {
                teamID = matchSide[ 1 ];
                teamName = matchSide[ 2 ];
            }
            if (!match) continue;
            await squads.push({
                squadID: match[ 1 ],
                squadName: match[ 2 ],
                size: match[ 3 ],
                locked: !!match[ 4 ].match(/true/i),
                teamID: teamID,
                teamName: teamName,
                creatorName: match[ 5 ],
                creatorEOSID: match[ 6 ],
                creatorSteamID: match[ 7 ],
                players: []
            });
        }

        return squads;
    }
}