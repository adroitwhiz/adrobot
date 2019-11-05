const fs = require('fs').promises;
const path = require('path');
const deburr = require('lodash.deburr');

const appUtils = require('../../common/app-utils.js');

const replacementsFile = 'data/replacements.json';

module.exports = {
	initializeData: () => {
		return fs.readFile(path.join(__dirname, replacementsFile)).then(contents => {
			return {
				replacements: JSON.parse(contents)
			};
		});
	},

	command: data => {
		return {
			commandFunction: (inputMessage, outputChannel, config, specialResults) => {
				let inputText = appUtils.parseCommand(inputMessage.content, {splitSpaces: false});

				if (!inputText.length > 0) {
					inputText = specialResults.previousMessage.content;
				}

				outputChannel.send(
					deburr(inputText.toLowerCase())
					.split('')
					.map(char => data.replacements.hasOwnProperty(char) ? data.replacements[char] : char)
					.join(''));
			},

			name: 'emojify',
			helpString: 'Replaces spaces in the previous message with emoji, possibly of your choice',
			specials: ['previousMessage']
		};
	}
};
