module.exports = {
	parseCommand: (messageContents, options) => {
		const slicedArgs = messageContents.split(' ').slice(1);

		if (options.splitSpaces === false) {
			return slicedArgs.join(' ');
		} else {
			return slicedArgs;
		}
	}
};
