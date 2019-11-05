const fs = require('fs').promises;
const path = require('path');
const Promise = require('bluebird');

const members = require('../../common/community-members.js');

const dataFolder = 'data';

const getRandomItem = arr => {
	return arr[Math.floor(Math.random() * arr.length)];
};

const shuffleArray = array => {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
};

const generateMatchupObject = (characters, serieses) => {
	let chosenCharacters = [];
	for (let i = 0; i < 2; i++) {
		chosenCharacters.push(getRandomItem(characters));
	}

	// Battle royale
	if (Math.random() < 0.05) {
		for (let i = 0; i < Math.floor(Math.random() * 7) + 1; i++) {
			chosenCharacters.push(getRandomItem(characters));
		}
	}

	const chosenMembers = members.slice(0);
	shuffleArray(chosenMembers);

	let castings = [];

	for (let i = 0; i < chosenCharacters.length; i++) {
		castings.push({
			'rapper': chosenMembers[i],
			'character': chosenCharacters[i]
		});
	}

	const series = getRandomItem(serieses);
	const seasonString = Math.random() < 0.5 ? 'Season ' + (Math.floor(Math.random() * 4) + 1) : '';

	return {
		'title': `**${chosenCharacters[0]} vs ${chosenCharacters[1]}**`,
		'series': `${series} ${seasonString}`,
		'castings': castings
	};
};

const renderMatchupEmbed = matchup => {
	const embed = {
		'title': matchup.title,
		'description': matchup.series,
		'fields': []
	};

	for (let casting of matchup.castings) {
		embed.fields.push({
			'name': `${casting.rapper}`,
			'value': `as ${casting.character}`,
			'inline': true
		});
	}

	return embed;
};

module.exports = {
	initializeData: () => {
		return Promise.props({
			'characters': fs.readFile(path.join(__dirname, dataFolder, 'characters.json')).then(JSON.parse),
			'series': fs.readFile(path.join(__dirname, dataFolder, 'series.json')).then(JSON.parse)
		});
	},

	command: data => {
		return {
			commandFunction: (inputMessage, outputChannel) => {
				const matchup = generateMatchupObject(data.characters, data.series);
				outputChannel.send('', {embed: renderMatchupEmbed(matchup)});
			},

			name: 'matchup',
			helpString: 'Generates a random rap battle matchup'
		};
	}
};
