const fs = require('fs').promises;
const path = require('path');
const deburr = require('lodash.deburr');

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
			commandFunction: (outputChannel, config, specialResults) => {
				let inputText = specialResults.args;

				if (!inputText.length > 0) {
					inputText = specialResults.previousMessage.content;
				}

				return outputChannel.send(
					deburr(inputText.toLowerCase())
						.split('')
						.map(char => data.replacements.hasOwnProperty(char) ? data.replacements[char] : char)
						.join(''));
			},

			name: 'emojify',
			helpString: 'Converts the previous message, or a message you provide, into emojis',
			specials: ['args', 'previousMessage']
		};
	}
};
