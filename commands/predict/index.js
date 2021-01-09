const fs = require('fs').promises;
const path = require('path');
const moment = require('moment');
const templateString = require('../../util/template-string');

const communityMembers = require('../../common/community-members.js');

const dataFolder = 'data';

const NUM_MILLISECONDS_IN_FIFTY_YEARS =
	1000 * //milliseconds per second
	60 *   //seconds per minute
	60 *   //minutes per hour
	24 *   //hours per day
	365 *  //days per year
	50;    //years per 50 years, obviously

const floatToMinMaxInclusive = (min, max, float) => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(float * (max - min + 1)) + min;
};

const predictionsTimeLowWeight = 5;

module.exports = {
	initializeData: () => {
		const data = {};
		return fs.readFile(path.join(__dirname, dataFolder, 'predictions.json')).then(json => {
			data.predictionStrings = JSON.parse(json);
		}).then(() => data);
	},

	command: data => {
		return {
			commandFunction: outputChannel => {
				const chosenPredictionTemplate =
					data.predictionStrings[Math.floor(Math.random() * data.predictionStrings.length)];
				const chosenPredictionMilliseconds = floatToMinMaxInclusive(
					1,
					NUM_MILLISECONDS_IN_FIFTY_YEARS,
					Math.pow(Math.random(), predictionsTimeLowWeight)
				);
				const chosenPredictionTimeString = moment(0).to(chosenPredictionMilliseconds);
				const predictionString = templateString(chosenPredictionTemplate, {
					communityMember: () => communityMembers[Math.floor(Math.random() * communityMembers.length)]
				});

				return outputChannel.send(`${chosenPredictionTimeString}, ${predictionString}`);
			},

			name: 'predict',
			helpString: 'Predicts your future'
		};
	}
};
