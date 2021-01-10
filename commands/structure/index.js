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

				// allow users to specify the total number of bars
				let numCoupletsPerRapper;
				let extraCouplet = false;
				if (args) {
					// divide bars by 2 to get couplets
					const numTotalCouplets = Math.floor(parseInt(args.trim()) / 2);
					if (Number.isNaN(numTotalCouplets)) return outputChannel.send('That isn\'t a valid battle length!');
					// check if there's an extra couplet to be randomly distributed between the two rappers
					extraCouplet = numTotalCouplets % 2 !== 0;
					numCoupletsPerRapper = Math.floor(numTotalCouplets / 2);
					if (numCoupletsPerRapper <= 0) return outputChannel.send('That\'s not enough bars!');
				} else {
					numCoupletsPerRapper = randomInt(4, 16);
				}
				// bias towards lower results
				const numVersesPerRapper = randomInt(1, numCoupletsPerRapper, Math.pow(Math.random(), 2));
				// if the total number of couplets isn't evenly distributable between rappers, give the extra couplet to
				// one of the two rappers randomly
				const distributeExtraCoupletTo = Math.round(Math.random());

				const rapper1VerseLengths = randWithSum(
					numVersesPerRapper,
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

				return outputChannel.send(interleaved.join('-'));
			},

			name: 'structure',
			helpString: 'Generates a random verse structure, optionally with a length of your choice',
			specials: ['args']
		};
	}
};
