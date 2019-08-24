const fs = require("fs").promises,
      path = require("path"),
      stringTemplate = require("string-template"),
      dot = require("dot"),
      moment = require("moment"),
      _ = require("lodash");

const appUtils = require("common/app-utils.js"),
      communityMembers = require("common/community-members.js");

const dataFolder = "data";

const NUM_MILLISECONDS_IN_FIFTY_YEARS =
	1000 * //milliseconds per second
	60 *   //seconds per minute
	60 *   //minutes per hour
	24 *   //hours per day
	365 *  //days per year
	50;    //years per 50 years, obviously



function floatToMinMaxInclusive(min, max, float) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(float * (max - min + 1)) + min;
}

module.exports = {
	initialize:() => {
		return fs.readFile(path.join(__dirname, dataFolder, "baseconf.json")).then(contents => JSON.parse(contents)).then(staticConfig => {
			return fs.readFile(path.join(__dirname, dataFolder, staticConfig.predictionsFile)).then(contents => {staticConfig.predictionStrings = JSON.parse(contents)}).then(() => {
				return {
					commandFunction:(inputMessage, outputChannel, config) => {
						const chosenPredictionTemplate = _.sample(staticConfig.predictionStrings),
						      chosenPredictionMilliseconds = floatToMinMaxInclusive(1, NUM_MILLISECONDS_IN_FIFTY_YEARS, Math.pow(Math.random(), staticConfig.predictionTimeLowWeight)),
						      chosenPredictionTimeString = _.capitalize(moment(0).to(chosenPredictionMilliseconds)),
						      predictionString = stringTemplate(staticConfig.predictionStringFormat, {time:chosenPredictionTimeString, prediction:dot.template(chosenPredictionTemplate)({communityMember:() => _.sample(communityMembers)})});
						
						outputChannel.send(predictionString);
					},
					name:"predict",
					helpString:"Predicts your future",
					configDirectory:"config",
					defaultConfig:"default.json"
				}
			})
		});
	}
}
