const mzfs = require("mz/fs"),
      path = require("path"),
      stringTemplate = require("string-template"),
      seedrandom = require("seedrandom"),
      _ = require("lodash");

const appUtils = require("app-utils.js");

const dataFolder = "data";

function floatToMinMaxInclusive(min, max, float) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(float * (max - min + 1)) + min;
}

module.exports = {
	initialize:() => {
		return mzfs.readFile(path.join(__dirname, dataFolder, "baseconf.json")).then(contents => JSON.parse(contents)).then(staticConfig => {
			return mzfs.readFile(path.join(__dirname, dataFolder, staticConfig.ratingStringsFile)).then(contents => {staticConfig.ratingStrings = JSON.parse(contents)}).then(() => {
				return {
					commandFunction:(inputMessage, outputChannel, config) => {
						const battleString = appUtils.parseCommand(inputMessage.content, {splitSpaces:false})[0].toLowerCase();
						
						if (battleString) {
							if (battleString.match(new RegExp(" vs ")) || battleString.match(new RegExp("https?://"))) {
								const battleRandom = seedrandom(battleString),
								      battleRandomScore = battleRandom(),
								      battleScores = _.mapValues({
									badScore:floatToMinMaxInclusive(0, 3, battleRandomScore),
									mediocreScore:floatToMinMaxInclusive(2, 5, battleRandomScore),
									averageScore:floatToMinMaxInclusive(3, 6, battleRandomScore),
									goodScore:floatToMinMaxInclusive(7, 10, battleRandomScore),
									greatScore:floatToMinMaxInclusive(8, 10, battleRandomScore),
									anyScore:floatToMinMaxInclusive(0, 10, battleRandomScore)
								}, score => `${score}/10`);
								
								outputChannel.send(stringTemplate(staticConfig.ratingStrings[floatToMinMaxInclusive(0, staticConfig.ratingStrings.length - 1, battleRandom())], battleScores));
							} else {
								outputChannel.send(staticConfig.notABattleString);
							}
						} else {
							outputChannel.send(staticConfig.noBattleString);
						}
					},
					name:"ratemybattle",
					helpString:"Rates your rap battle",
					configDirectory:"config",
					defaultConfig:"default.json"
				}
			})
		});
	}
}
