const mzfs = require("mz/fs"),
      path = require("path"),
      mustache = require("mustache"),
      Promise = require("bluebird"),
      parseArgs = require("minimist"),
      shellQuote = require("shell-quote"),
      _ = require("lodash");

const dataFolder = "data";
let staticConfig;

function escapeMarkdownUrl(url) {
	return url.split("(").join("%28").split(")").join("%29"); //super reliable
}

function sendBeatEmbed(chosenBeat, data, outputChannel) {
	const compiledStrings = {};
	
	for (let i in data.templateStrings) {
		if (data.templateStrings.hasOwnProperty(i)) {
			const view = {
				name:chosenBeat.name,
				producers:chosenBeat.producers ? chosenBeat.producers.join(", ") : null,
				beatPageUrl:chosenBeat.pageUrl ? escapeMarkdownUrl(chosenBeat.pageUrl) : null,
				beatFileUrl:chosenBeat.fileUrl ? escapeMarkdownUrl(chosenBeat.fileUrl) : null,
				beatBpm:chosenBeat.bpm ? chosenBeat.bpm.toString() : null,
				beatGenres:chosenBeat.genres ? chosenBeat.genres.join(", ") : null,
				beatMoods:chosenBeat.moods ? chosenBeat.moods.join(", ") : null,
				beatUnmonetizable:chosenBeat.availableForPurchase === false ? true : null
			};
			
			const renderedString = mustache.render(data.templateStrings[i], view);
			
			if (renderedString.length > 0) {
				compiledStrings[i] = JSON.stringify(renderedString);
			}
		}
	}
	
	const compiledConfig = mustache.render(data.templates.full, compiledStrings);
	
	outputChannel.send("", {embed:JSON.parse(compiledConfig)});
}

module.exports = {
	initialize:() => {
		return mzfs.readFile(path.join(__dirname, dataFolder, "baseconf.json")).then(contents => {staticConfig = JSON.parse(contents)}).then(() => {
			return Promise.props({
				"beats":mzfs.readdir(path.join(__dirname, dataFolder, staticConfig.beatFolder)).then(files => {
					return Promise.all(files.map(file => mzfs.readFile(path.join(__dirname, dataFolder, staticConfig.beatFolder, file), {encoding:"utf8"})));
				}).then(beatFiles => beatFiles.reduce((acc, val) => acc.concat(JSON.parse(val)), [])),
				"templateStrings":mzfs.readFile(path.join(__dirname, dataFolder, staticConfig.templateStringsPath)).then(strings => JSON.parse(strings)),
				"strings":mzfs.readFile(path.join(__dirname, dataFolder, staticConfig.stringsPath)).then(strings => JSON.parse(strings)),
				"templates":(() => {
					const templatePaths = staticConfig.templatePaths,
					      templateFilePromises  = {};
					
					for (let i in templatePaths) {
						if (templatePaths.hasOwnProperty(i)) {
							templateFilePromises[i] = mzfs.readFile(path.join(__dirname, dataFolder, staticConfig.templateFolder, templatePaths[i]), {encoding:"utf8"});
						}
					}
					
					return Promise.props(templateFilePromises);
				})()
			});
		}).then(data => {
			return {
				commandFunction:(inputMessage, outputChannel, config) => {
					const argvArray = shellQuote.parse(inputMessage.content.split(" ").slice(1).join(" ")),
					      argv = parseArgs(argvArray, {alias:{"b":"bpm", "p":"producers", "n":"name", "u":"url-contains", "producer":"producers", "m":"moods", "mood":"moods", "g":"genres","genre":"genres"}}),
					      parsedOpts = {};
					
					//step 1: parse arguments
					
					let argsValid = true;
					
					if (argv.bpm) {
						argv.bpm = argv.bpm.toString();
						const bpmSplit = argv.bpm.split("-");
						if (bpmSplit.length === 2) {
							parsedOpts.bpmMin = parseFloat(bpmSplit[0]);
							parsedOpts.bpmMax = parseFloat(bpmSplit[1]);
						} else if (bpmSplit.length === 1) {
							parsedOpts.bpmMin = parsedOpts.bpmMax = parseFloat(bpmSplit[0]);
						} else {
							argsValid = false;
						}
					}
					
					if (argv["exact-name"]) {
						parsedOpts.exactName = argv["exact-name"];
					}
					
					
					if (argv.producers) {
						parsedOpts.producers = argv.producers.split(",").map(p => p.trim().toLowerCase());
					}
					
					if (argv.name) {
						parsedOpts.name = argv.name.toString();
					}
					
					if (argv["url-contains"]) {
						parsedOpts.url = argv["url-contains"];
					}
					
					if (argv["moods"]) {
						parsedOpts.moods = argv["moods"].toLowerCase().split(",");
					}
					
					if (argv["genres"]) {
						parsedOpts.genres = argv["genres"].toLowerCase().split(",");
					}
					
					if (argv["purchasable"]) {
						parsedOpts.purchasable = true;
					}
					
					if (argv["every"]) {
						parsedOpts.fetchEveryMatching = true;
					}
					
					if (argv["num"]) {
						parsedOpts.numBeats = parseInt(argv["num"]);
					}
					
					//step 2: filter based on arguments
					
					let matchingBeats = data.beats;
					
					if (parsedOpts.exactName) {
						matchingBeats = matchingBeats.filter(beat => beat.name.toLowerCase() === parsedOpts.exactName.toLowerCase());
					}
					
					if (parsedOpts.bpmMin) {
						matchingBeats = matchingBeats.filter(beat => beat.bpm >= parsedOpts.bpmMin && beat.bpm <= parsedOpts.bpmMax);
					}
					
					if (parsedOpts.producers) {
						matchingBeats = matchingBeats.filter(beat => {
							if (!beat.producers) return false;
							
							const lowerCaseProducers = beat.producers.map(p => p.toLowerCase());
							
							return parsedOpts.producers.reduce((prev, curr) => lowerCaseProducers.indexOf(curr) !== -1 || prev, false);
						});
					}
					
					if (parsedOpts.name) {
						let lowerCaseName = parsedOpts.name.toLowerCase();
						matchingBeats = matchingBeats.filter(beat =>
							beat.name.toLowerCase().includes(lowerCaseName)
						)
					}
					
					if (parsedOpts.url) {
						matchingBeats = matchingBeats.filter(beat =>
							beat.fileUrl.includes(parsedOpts.url)
						)
					}
					
					if (parsedOpts.moods) {
						matchingBeats = matchingBeats.filter(beat =>
							beat.moods && beat.moods.some(mood => parsedOpts.moods.indexOf(mood.toLowerCase()) !== -1)
						)
					}
					
					if (parsedOpts.genres) {
						matchingBeats = matchingBeats.filter(beat =>
							beat.genres && beat.genres.some(genre => parsedOpts.genres.indexOf(genre.toLowerCase()) !== -1)
						)
					}
					
					if (parsedOpts.purchasable) {
						matchingBeats = matchingBeats.filter(beat =>
							beat.availableForPurchase !== false
						)
					}
					
					//step 3: do the rest
					
					if (matchingBeats.length > 0) {
						if (parsedOpts.fetchEveryMatching || parsedOpts.numBeats > 1) {
							let shuffledMatchingBeats = _.shuffle(matchingBeats);
							
							if (parsedOpts.numBeats > 1) {
								shuffledMatchingBeats = shuffledMatchingBeats.slice(0, parsedOpts.numBeats);
							}
							
							if (shuffledMatchingBeats.length > config.maxMatchingBeats) {
								outputChannel.send(mustache.render(data.strings.beatLimitExceeded, {maxBeats:config.maxMatchingBeats}));
							} else {
								shuffledMatchingBeats.forEach(beat => {
									sendBeatEmbed(beat, data, outputChannel);
								})
							}
						} else {
							const chosenBeat = _.sample(matchingBeats);
							sendBeatEmbed(chosenBeat, data, outputChannel);
						}
					} else {
						outputChannel.send(data.strings.noMatchingBeats);
					}
					
					const chosenBeat = _.sample(matchingBeats);
					
					if (chosenBeat) {
						
					} else {
						
					}
				},
				name:"beat",
				helpString:"Serves up a funky fresh beat",
				configDirectory:"config",
				defaultConfig:"default.json"
			}
		});
	}
}
