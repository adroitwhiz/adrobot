const mzfs = require("mz/fs"),
      path = require("path"),
      _ = require("lodash");

const appUtils = require("common/app-utils.js");

const dataFolder = "data",
      emojiFile = "emojis.json";

const emojiKeywords = require("emojis-keywords");

function isEmoji(str) {
	return emojiKeywords.indexOf(str) !== -1;
}

function escapeEmojiString(str) { //my proudest creation
	const strColonIndices = [];
	
	let lastIndex = str.indexOf(":");
	
	while (lastIndex !== -1) {
		if (str.charAt(lastIndex - 1) !== "\\")
			strColonIndices.push(lastIndex);
		lastIndex = str.indexOf(":", lastIndex + 1);
	}
	
	const nonEscapeColonIndices = [];
	
	const strArr = str.split("");
	
	for (var i = 0, end = strColonIndices.length; i < end; i++) {
		if (!isEmoji(str.substring(strColonIndices[i], strColonIndices[i+1]+1)) && !isEmoji(str.substring(strColonIndices[i-1], strColonIndices[i]+1))) {
			strArr[strColonIndices[i]] = "\\:";
		}
	}
	return strArr.join("");
}

module.exports = {
	initialize:() => {
		return mzfs.readFile(path.join(__dirname, dataFolder, emojiFile)).then(contents => { //using path.join instead of a "/"? it's not bloated, it's robust!
			const emojis = JSON.parse(contents).map(emojiCode => String.fromCodePoint(emojiCode));
			
			return {
				commandFunction:(inputMessage, outputChannel, config, specialResults) => {
					const emojiToUse = appUtils.parseCommand(inputMessage.content, {splitSpaces:false})[0],
					      textToEmojify = escapeEmojiString(specialResults.previousMessage.content);
					
					let emojifiedText;
					
					if (emojiToUse.length > 0) {
						emojifiedText = textToEmojify.split(" ").join(emojiToUse);
					} else {
						let splitText = textToEmojify.split(" ");
						
						for (let i = 0; i < splitText.length - 1; i++) {
						let chosenEmoji = _.sample(emojis);
							splitText[i] += chosenEmoji;
						};
						
						emojifiedText = splitText.join("");
					}
					
					outputChannel.send(emojifiedText);
				},
				
				name:"emojispace",
				helpString:"Replaces spaces in the previous message with emoji, possibly of your choice",
				configDirectory:"config",
				defaultConfig:"default.json",
				specials:["previousMessage"]
			};
		});
	}
}
