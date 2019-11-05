const fs = require('fs').promises;
const path = require('path');
const cloneDeep = require('lodash.clonedeep');
const merge = require('lodash.merge');

const CONFIG_DIRECTORY = 'config';

class ConfigFetcher {
	constructor(options) {
		this.defaultConfig = options.defaultConfig || null;

		this._loadedConfigs = new Map();

		this.CONFIG_TYPE_DEFAULT = Symbol('CONFIG_TYPE_DEFAULT'); //is this good practice? i don't think so
	}

	fetchGuildConfig(guild) {
		let configIdentifier = `bot-${guild ? guild.id : 'noguild'}`;

		return this._getMergedConfig(configIdentifier, guild);
	}

	fetchCommandConfig (guild, command) {
		return this.fetchGuildConfig(guild).then(config => {
			if (config.commands.hasOwnProperty(command)) {
				return config.commands[command];
			} else {
				return {};
			}
		});
	}

	_getMergedConfig(identifier, guild) {
		if (guild === this.CONFIG_TYPE_DEFAULT) {
			return this._getConfigFromSomewhere(identifier, guild);
		} else {
			return Promise.all([
				this._getConfigFromSomewhere(identifier, this.CONFIG_TYPE_DEFAULT),
				guild ? this._getConfigFromSomewhere(identifier, guild) : Promise.resolve({})
			]).then(configs => {
				const baseConfig = configs[0];
				const guildConfig = configs[1];
				const merged = merge(cloneDeep(baseConfig), guildConfig);
				return merged;
			});
		}
	}

	_getConfigFromSomewhere(identifier, guild) {
		if (this._loadedConfigs.has(identifier)) {
			return Promise.resolve(this._loadedConfigs.get(identifier));
		} else {
			return this._readConfigFile(path.join(CONFIG_DIRECTORY, guild === this.CONFIG_TYPE_DEFAULT ? 'default.json' : `${guild.id}.json`)).then(fileContents => {
				let parsedConfig = JSON.parse(fileContents);
				this._loadedConfigs.set(identifier, parsedConfig);
				return parsedConfig;
			});
		}
	}

	_readConfigFile(path) {
		console.log(`Reading config path ${path}`);

		return fs.readFile(path).then(fileContents => {
			return fileContents;
		}, error => {
			if (error.code === 'ENOENT') {
				return null;
			} else {
				throw error;
			}
		});
	}
}

module.exports = ConfigFetcher;
