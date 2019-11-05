const fs = require('fs').promises;
const path = require('path');

module.exports = {
	initializeData: () => {
		return fs.readFile(path.join(__dirname, 'bees.txt'), 'utf8').then(
			contents => { return {beeList: contents.split('\n')}; }
		);
	},

	command: data => {
		return {
			commandFunction: (inputMessage, outputChannel) => {
				outputChannel.send(data.beeList[Math.floor(Math.random() * data.beeList.length)]);
			},

			name: 'bees',
			helpString: 'Bees'
		};
	}
};
