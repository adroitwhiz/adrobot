const randomInt = (min, max, rnd) => Math.floor((typeof rnd === 'number' ? rnd : Math.random()) * (max - min + 1)) + min;

// Generate a list of n random numbers in range [1, m - n] which sum to m
const randWithSum = (numNumbers, sum) => {
	const adjustedSum = sum - numNumbers;
	if (adjustedSum < 0) throw new Error(`Cannot create list of ${numNumbers} positive numbers which sum to ${sum}`);
	const numbers = [0];
	for (let i = 0; i < numNumbers - 1; i++) {
		numbers.push(randomInt(0, adjustedSum));
	}
	numbers.push(adjustedSum);
	numbers.sort((a, b) => a - b);
	const diffs = [];
	for (let i = 0; i < numNumbers; i++) {
		diffs.push(numbers[i + 1] - numbers[i] + 1);
	}
	return diffs;
};

module.exports = {
	command: () => {
		return {
			commandFunction: (outputChannel, config, specialResults) => {
				const {args} = specialResults;
				let argTotalCouplets;
				let argTotalVerses;
				if (args) {
					const argsSplit = args.split(' ');
					if (argsSplit.length >= 1) {
						argTotalCouplets = Math.floor(parseInt(argsSplit[0]) / 2);
						if (Number.isNaN(argTotalCouplets)) return outputChannel.send('That isn\'t a valid battle length!');

						if (argsSplit.length >= 2) {
							argTotalVerses = parseInt(argsSplit[1]);
							if (Number.isNaN(argTotalVerses)) return outputChannel.send('That isn\'t a valid number of verses!');
						}
					}
				}

				// allow users to specify the total number of bars
				let numCoupletsPerRapper;
				let extraCouplet = false;

				if (argTotalCouplets) {
					// check if there's an extra couplet to be randomly distributed between the two rappers
					extraCouplet = argTotalCouplets % 2 !== 0;
					numCoupletsPerRapper = Math.floor(argTotalCouplets / 2);
					if (numCoupletsPerRapper <= 0) return outputChannel.send('Battles need at least 4 bars!');
					if (numCoupletsPerRapper >= 500) return outputChannel.send('That\'s too many bars!');
				} else {
					numCoupletsPerRapper = randomInt(4, 16);
				}


				let numVersesPerRapper;
				let extraVerse = false;

				if (argTotalVerses) {
					if (argTotalVerses < 2) return outputChannel.send('Battles need at least 2 verses!');
					if (argTotalVerses > (numCoupletsPerRapper * 2) + Number(extraCouplet)) return outputChannel.send('That\'s too many verses!');
					numVersesPerRapper = Math.floor(argTotalVerses / 2);
					extraVerse = argTotalVerses % 2 !== 0;
				} else {
					numVersesPerRapper = randomInt(
						1,
						numCoupletsPerRapper,
						// bias towards lower results
						Math.pow(Math.random(), 2)
					);
				}

				// if the total number of couplets isn't evenly distributable between rappers, give the extra couplet to
				// one of the two rappers randomly
				const distributeExtraCoupletTo = Math.round(Math.random());

				const rapper1VerseLengths = randWithSum(
					numVersesPerRapper + Number(extraVerse),
					numCoupletsPerRapper + (extraCouplet ? distributeExtraCoupletTo : 0)
				);
				const rapper2VerseLengths = randWithSum(
					numVersesPerRapper,
					numCoupletsPerRapper + (extraCouplet ? (1 - distributeExtraCoupletTo) : 0)
				);

				// interleave verses
				const interleaved = [];
				for (let i = 0; i < numVersesPerRapper; i++) {
					interleaved.push(rapper1VerseLengths[i] * 2);
					interleaved.push(rapper2VerseLengths[i] * 2);
				}

				if (extraVerse) {
					interleaved.push(rapper1VerseLengths[rapper1VerseLengths.length - 1] * 2);
				}

				return outputChannel.send(interleaved.join('-'));
			},

			name: 'structure',
			helpString: 'Generates a random verse structure, optionally with a length (and number of verses) of your choice',
			advancedHelpString: 'Usage: {prefix}structure [battle length] [number of verses]',
			specials: ['args']
		};
	}
};
