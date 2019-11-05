const fs = require('fs').promises;
const path = require('path');
const emojiKeywords = require('emojis-keywords');

const appUtils = require('../../common/app-utils.js');

const emojiFile = 'data/emojis.json';

const isEmoji = (str) => {
	return emojiKeywords.indexOf(str) !== -1;
};

const escapeEmojiString = (str) => { //my proudest creation
	const strColonIndices = [];

	let lastIndex = str.indexOf(':');

	while (lastIndex !== -1) {
		if (str.charAt(lastIndex - 1) !== '\\')
			strColonIndices.push(lastIndex);
		lastIndex = str.indexOf(':', lastIndex + 1);
	}

	const strArr = str.split('');

	for (let i = 0, end = strColonIndices.length; i < end; i++) {
		if (!isEmoji(str.substring(strColonIndices[i], strColonIndices[i+1]+1)) && !isEmoji(str.substring(strColonIndices[i-1], strColonIndices[i]+1))) {
			strArr[strColonIndices[i]] = '\\:';
		}
	}
	return strArr.join('');
};

module.exports = {
	initializeData: () => {
		return fs.readFile(path.join(__dirname, emojiFile)).then(contents => {
			const emojis = JSON.parse(contents).map(emojiCode => String.fromCodePoint(emojiCode));

			return {
				emojis: emojis
			};
		});
	},

	command: data => {
		return {
			commandFunction: (inputMessage, outputChannel, config, specialResults) => {
				const emojiToUse = appUtils.parseCommand(inputMessage.content, {splitSpaces: false});
				const textToEmojify = escapeEmojiString(specialResults.previousMessage.content);

				let emojifiedText;

				if (emojiToUse.length > 0) {
					emojifiedText = textToEmojify.split(' ').join(emojiToUse);
				} else {
					let splitText = textToEmojify.split(' ');

					for (let i = 0; i < splitText.length - 1; i++) {
					let chosenEmoji = data.emojis[Math.floor(Math.random() * data.emojis.length)];
						splitText[i] += chosenEmoji;
					}

					emojifiedText = splitText.join('');
				}

				return outputChannel.send(emojifiedText);
			},

			name: 'emojispace',
			helpString: 'Replaces spaces in the previous message with emoji, possibly of your choice',
			specials: ['previousMessage']
		};
	}
};
