const fs = require('fs').promises;
const path = require('path');
const seedrandom = require('seedrandom');
const templateString = require('../../util/template-string');

const ratingStringsPath = 'data/rating-strings.json';

const floatToMinMaxInclusive = (min, max, float) => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(float * (max - min + 1)) + min;
};

module.exports = {
	initializeData: () => {
		return fs.readFile(path.join(__dirname, ratingStringsPath))
			.then(contents => { return {ratingStrings: JSON.parse(contents)}; });
	},

	command: data => {
		return {
			commandFunction: (outputChannel, config, specials) => {
				const battleString = specials.args.toLowerCase();

				if (!battleString) return outputChannel.send('Which battle am I supposed to review?');

				if (battleString.match(new RegExp(' vs? ')) || battleString.match(new RegExp('https?://'))) {
					const battleRandom = seedrandom(battleString);
					const battleRandomScore = battleRandom();
					const battleScores = {
						badScore: floatToMinMaxInclusive(0, 3, battleRandomScore),
						mediocreScore: floatToMinMaxInclusive(2, 5, battleRandomScore),
						averageScore: floatToMinMaxInclusive(3, 6, battleRandomScore),
						goodScore: floatToMinMaxInclusive(7, 10, battleRandomScore),
						greatScore: floatToMinMaxInclusive(8, 10, battleRandomScore),
						anyScore: floatToMinMaxInclusive(0, 10, battleRandomScore)
					};

					for (const scoreKey of Object.keys(battleScores)) {
						battleScores[scoreKey] = `${battleScores[scoreKey]}/10`;
					}

					return outputChannel.send(
						templateString(data.ratingStrings[
							floatToMinMaxInclusive(0, data.ratingStrings.length - 1, battleRandom())
						], battleScores)
					);
				} else {
					return outputChannel.send('That doesn\'t look like a rap battle.');
				}
			},
			name: 'ratemybattle',
			helpString: 'Rates your rap battle',
			specials: ['args']
		};
	}
};
