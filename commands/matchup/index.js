const fs = require("fs").promises,
      path = require("path"),
	  Promise = require("bluebird");

const members = require("common/community-members.js");

function getRandomItem(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(array) {
	for (var i = array.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
}

function generateMatchupObject(characters, serieses) {
	let chosenCharacters = [];
	for (let i = 0; i < 2; i++) {
		chosenCharacters.push(getRandomItem(characters));
	}
	if (Math.random() < 0.05) {
		for (let i = 0; i < Math.floor(Math.random() * 7) + 1; i++) {
			chosenCharacters.push(getRandomItem(characters));
		}
	}
	
	let chosenMembers = members.slice(0);
	shuffleArray(chosenMembers);
	//chosenMembers = chosenMembers.slice(chosenCharacters.length);
	
	let castings = [];
	
	for (let i = 0; i < chosenCharacters.length; i++) {
		castings.push({
			"rapper":chosenMembers[i],
			"character":chosenCharacters[i]
		});
	}

	const series = getRandomItem(serieses);
	const seasonString = Math.random() < 0.5 ? "Season " + (Math.floor(Math.random() * 4) + 1) : "";
	
	//return chosenCharacters[0] + " vs " + chosenCharacters[1] + separators.getRandomItem() + series.getRandomItem() + (Math.random() < 0.5 ? " Season " + (Math.floor(Math.random() * 4) + 1) : "") + "\n" + memberCharacterPairs.join("\n") + "\n" + "Beat: " + chosenBeat.name + " by Kustom (" + chosenBeat.url + ")";
	return {
		"title":`**${chosenCharacters[0]} vs ${chosenCharacters[1]}**`,
		"series":`${series} ${seasonString}`,
		"castings":castings
	}
}

function renderMatchupEmbed(matchup) {
	const embed = {
		"title":matchup.title,
		"description":matchup.series,
		"fields":[]
	}

	for (let casting of matchup.castings) {
		embed.fields.push({
			"name":`${casting.rapper}`,
			"value":`as ${casting.character}`,
			"inline":true
		});
	}

	return embed;
}

const dataFolder = "data";
module.exports = {
	initialize:() => {
		return fs.readFile(path.join(__dirname, dataFolder, "baseconf.json")).then(JSON.parse)
		.then(staticConfig => {
			return Promise.props({
				"characters":fs.readFile(path.join(__dirname, dataFolder, staticConfig.charactersPath)).then(JSON.parse),
				"series":fs.readFile(path.join(__dirname, dataFolder, staticConfig.seriesPath)).then(JSON.parse)
			})
		}).then(data => {
			return {
				commandFunction:(inputMessage, outputChannel, config) => {
					const matchup = generateMatchupObject(data.characters, data.series);
					outputChannel.send("", {embed:renderMatchupEmbed(matchup)});
				},
				
				name:"matchup",
				helpString:"Generates a random rap battle matchup",
				configDirectory:"config",
				defaultConfig:"default.json"
			}
		});
	}
}
