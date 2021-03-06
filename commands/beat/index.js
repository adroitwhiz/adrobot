const fs = require('fs').promises;
const path = require('path');
const Fuse = require('fuse.js');
const escapeUrlForMarkdown = require('../../util/escape-url-for-markdown');

const beatsFolder = path.join(__dirname, 'beats');

// Shamelessly yanked from StackOverflow: https://stackoverflow.com/a/19270021
const getRandom = (arr, n) => {
	const result = new Array(n);
	let len = arr.length;
	const taken = new Array(len);
	if (n > len)
		throw new RangeError('getRandom: more elements taken than available');
	while (n--) {
		const x = Math.floor(Math.random() * len);
		result[n] = arr[x in taken ? taken[x] : x];
		taken[x] = --len in taken ? taken[len] : len;
	}
	return result;
};

const escapeMarkdown = text => {
	const unescaped = text.replace(/\\(\*|_|`|~|\\)/g, '$1'); // unescape any "backslashed" character
	const escaped = unescaped.replace(/(\*|_|`|~|\\)/g, '\\$1'); // escape *, _, `, ~, \
	return escaped;
};

// Forgiving argument parser.
// An argument is preceded by at least one minus sign ("-"), and may or may not contain an equals sign ("=").
// Spaces do not separate arguments.
// Example valid argument string: "--producers=hollywood legend -bpm 50-60 -mood=snoozy -g hip hop"
const parseArgs = (args, aliases) => {
	// Separate arguments by minus sign, first splitting then trimming zero-width characters
	// (from e.g. two sequential minuses)
	return new Map(args.split(/(\s|^)+--?/g).filter(item => item.length !== 0)
		.map(item => {
			// The first word after the minus sign(s) is the name of the argument.
			// This is true whether there's an equals sign there or just a space,
			// so replace the first equals sign with a space (String.replace won't replace more than the first).
			const trimmed = item.trim().replace('=', ' ');
			const argv = trimmed.split(' ');
			// The first word is the argument name, the rest are the argument value.
			let argName = argv.shift();
			const argValue = argv.join(' ');

			// If the argument name is an alias for another argument name, switch it out for that one.
			if (aliases.hasOwnProperty(argName)) {
				argName = aliases[argName];
			}

			return [argName, argValue];
		}));
};

const argAliases = {
	'g': 'genres',
	'm': 'moods',
	'n': 'name',
	'b': 'bpm',
	'p': 'producers',
	'u': 'url',
	'genre': 'genres',
	'mood': 'moods',
	'producer': 'producers'
};

const argHelp = {
	'name': 'Name of the beat you\'re looking for.',
	'exact-name': 'Name of the beat you\'re looking for, exactly as typed (no "fuzzy" matching).',
	'name-contains': 'Filter by beats whose names include this text somewhere',
	'producers': 'Beat producer(s) to filter by, separated with commas.',
	'genres': 'Genre(s) to filter by, separated with commas. Beats with at least one matching genre will be displayed.',
	'moods': 'Mood(s) to filter by, separated with commas. Beats with at least one matching mood will be displayed.',
	'bpm': 'Tempo (in beats per minute) of the beat you want. This can be a single number (e.g 80) or a range (e.g. 80-90).',
	'purchasable': 'Filter out beats that have *definitely* been sold. Does not guarantee that returned beats can be bought.',
	'every': 'Return every beat (up to a limit) matching your filter(s), instead of just one.',
	'num': 'Return this many matching beats.',
	'url': 'Filter beats whose audio file links contain this text. Useful for finding the name of a beat given an audio file.',
	'more': 'Overrides all other options. Use the same set of options as the last -beat command in this channel.'
};

const argHelpString = (() => {
	const helpStringEntries = [];
	for (const argName of Object.keys(argHelp)) {
		const matchingAliases = Object.entries(argAliases).filter(alias => alias[1] === argName).map(arg => arg[0]);
		matchingAliases.push(argName);
		helpStringEntries.push(`${matchingAliases.map(arg => '-' + arg).join(', ')}: ${argHelp[argName]}`);
	}

	return helpStringEntries.join('\n');
})();

const filterByAnyKeySubstring = (array, prop, keys) => {
	return array.filter(item => {
		for (const filterKey of keys) {
			if (item[prop] && item[prop].findIndex(itemKey => itemKey.toLowerCase().includes(filterKey)) !== -1) {
				return true;
			}
		}
		return false;
	});
};

module.exports = {
	initializeData: () => {
		return fs.readdir(beatsFolder).then(contents =>
			Promise.all(contents.map(filename => fs.readFile(path.join(beatsFolder, filename), {encoding: 'utf-8'}).then(JSON.parse)))
		).then(beatLists => { return {
			beats: beatLists.flat(),
			lastCommandInChannel: new Map()
		}; });
	},

	command: data => {
		const fuse = new Fuse(data.beats, {
			shouldSort: true,
			keys: [
				'name'
			],
			maxPatternLength: 32
		});

		return {
			commandFunction: (outputChannel, config, specials) => {
				let argv = parseArgs(
					specials.args,
					argAliases
				);

				// the -more argument overrides argv with those of the last -beat command
				if (argv.has('more')) {
					if (data.lastCommandInChannel.has(outputChannel.id)) {
						argv = data.lastCommandInChannel.get(outputChannel.id);
					} else {
						return outputChannel.send('Cannot remember last -beat command');
					}
				} else {
					data.lastCommandInChannel.set(outputChannel.id, argv);
				}

				let matchingBeats;
				let shouldRandomize = true;

				// Mutually exclusive filtering functions.
				// TODO: error if you try to use more than one at a time.
				if (argv.has('exact-name')) {
					const exactName = argv.get('exact-name').toLowerCase();
					matchingBeats = data.beats.filter(beat => beat.name.toLowerCase() === exactName);
				} else if (argv.has('name-contains')) {
					const substring = argv.get('name-contains').toLowerCase();
					matchingBeats = data.beats.filter(beat => beat.name.toLowerCase().includes(substring));
				} else if (argv.has('name')) {
					matchingBeats = fuse.search(argv.get('name'));
					shouldRandomize = false;
				} else if (argv.has('url')) {
					const urlFragment = argv.get('url').toLowerCase();
					matchingBeats = data.beats.filter(beat => beat.fileUrl.toLowerCase().includes(urlFragment));
				} else {
					matchingBeats = Array.from(data.beats);
				}

				if (argv.has('bpm')) {
					const bpmRange = argv.get('bpm').split('-').map(n => Number(n));
					if (bpmRange.length === 1) {
						// Single exact BPM
						const bpm = bpmRange[0];
						// a little room for error
						matchingBeats = matchingBeats.filter(beat => beat.bpm && Math.abs(bpm - beat.bpm) < 0.01);
					} else {
						// BPM range
						const bpmMin = Math.min(bpmRange[0], bpmRange[1]);
						const bpmMax = Math.max(bpmRange[0], bpmRange[1]);
						// a little room for error
						matchingBeats = matchingBeats.filter(beat =>
							beat.bpm > bpmMin - 0.01 && beat.bpm < bpmMax + 0.01);
					}
				}

				if (argv.has('producers')) {
					const producersArg = argv.get('producers').toLowerCase().split(',').map(prodName => prodName.trim());

					matchingBeats = filterByAnyKeySubstring(matchingBeats, 'producers', producersArg);
				}

				if (argv.has('genres')) {
					const genresArg = argv.get('genres').toLowerCase().split(',').map(name => name.trim());

					matchingBeats = filterByAnyKeySubstring(matchingBeats, 'genres', genresArg);
				}

				if (argv.has('moods')) {
					const moodsArg = argv.get('moods').toLowerCase().split(',').map(name => name.trim());

					matchingBeats = filterByAnyKeySubstring(matchingBeats, 'moods', moodsArg);
				}

				if (argv.has('purchasable')) {
					// use strict equals here in case availableForPurchase is undefined
					matchingBeats = matchingBeats.filter(beat => beat.availableForPurchase !== false);
				}

				if (matchingBeats.length === 0) {
					return outputChannel.send('No matching beats found.');
				}

				let beatsToReturn;

				if (argv.has('every')) {
					beatsToReturn = matchingBeats;
				} else if (argv.has('num')) {
					const numBeats = Number(argv.get('num'));
					beatsToReturn = shouldRandomize ?
						getRandom(matchingBeats, Math.min(numBeats, matchingBeats.length)) :
						matchingBeats.slice(0, numBeats);
				} else {
					beatsToReturn = [
						shouldRandomize ?
							matchingBeats[Math.floor(Math.random() * matchingBeats.length)] :
							matchingBeats[0]
					];
				}

				if (!config.maxBeats || beatsToReturn.length > config.maxBeats) {
					return outputChannel.send(`${beatsToReturn.length} beats found, but I can only display ${config.maxBeats} at once.`);
				}

				const sendPromises = [];

				for (const beat of beatsToReturn) {
					const embed = {
						title: `**${escapeMarkdown(beat.name)}** by **${escapeMarkdown(beat.producers ? beat.producers.join(', ') : '???')}**`,
						fields: [
							{
								name: 'Audio file',
								value: `[Listen](${escapeUrlForMarkdown(beat.fileUrl)})`,
								inline: true
							},
							{
								name: 'Beat page',
								value: `[Visit](${escapeUrlForMarkdown(beat.pageUrl)})`,
								inline: true
							}
						]
					};

					if (beat.bpm) {
						embed.fields.push({
							name: 'BPM',
							value: beat.bpm.toString()
						});
					}

					if (beat.genres && beat.genres.length > 0) {
						embed.fields.push({
							name: 'Genres',
							value: beat.genres.join(', '),
							inline: true
						});
					}

					if (beat.moods && beat.moods.length > 0) {
						embed.fields.push({
							name: 'Moods',
							value: beat.moods.join(', '),
							inline: true
						});
					}

					if (beat.availableForPurchase === false) {
						embed.footer = {
							icon_url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/2.2.5/36x36/26a0.png',
							text: 'This beat has been purchased. It may be unmonetizable.'
						};
					}

					sendPromises.push(outputChannel.send('', {embed: embed}));
				}

				return Promise.all(sendPromises);
			},

			name: 'beat',
			helpString: 'Serves up a funky fresh beat',
			advancedHelpString: argHelpString,
			specials: ['args']
		};
	}
};
