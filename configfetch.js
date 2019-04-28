const mzfs = require("mz/fs"),
      path = require("path");

class ConfigFetcher {
	constructor(options) {
		this.maxLoadedConfigLimit = options.maxLoadedConfigLimit || -1; //currently does jack shit, which is definitely not a problem and will never become one
		this.defaultConfig = options.defaultConfig || null;
		
		this._loadedConfigs = new Map();
		
		this.CONFIG_TYPE_DEFAULT = Symbol("CONFIG_TYPE_DEFAULT"); //is this good practice? i don't think so
	}
	
	fetchCommandConfig(command, guild, force) {
		if (guild) {
			let configIdentifier = `${command.name}-${guild.id}`; //this will work just fine and will LITERALLY NEVER BREAK; 10/10 robust code. ToonMemeBot 2.0 is definitely off to a great start, guys
		
			return this._getMergedConfig(configIdentifier, guild, path.join(command._commandLocation, command.configDirectory));
		} else {
			return this._getConfigFromSomewhere(null, this.CONFIG_TYPE_DEFAULT, path.join(command._commandLocation, command.configDirectory));
		}
	}
	
	fetchBotConfig(location, guild, force) {
		let configIdentifier = `bot-${guild ? guild.id : "noguild"}`;
		
		return this._getMergedConfig(configIdentifier, guild, location);
	}
	
	_getMergedConfig(identifier, guild, location, forceReload) {
		if (guild === this.CONFIG_TYPE_DEFAULT) {
			return _getConfigFromSomewhere(identifier, guild, location, forceReload);
		} else {
			return Promise.all([
				this._getConfigFromSomewhere(identifier, this.CONFIG_TYPE_DEFAULT, location, forceReload),
				guild ? this._getConfigFromSomewhere(identifier, guild, location, forceReload) : Promise.resolve(null)
			]).then(configs => Object.assign({}, configs[0], configs[1]));
		}
	}
	
	_getConfigFromSomewhere(identifier, guild, location, forceReload) {
		if (this._loadedConfigs.has(identifier) && !forceReload) {
			return Promise.resolve(this._loadedConfigs.get(identifier));
		} else {
			return this._readConfigFile(guild === this.CONFIG_TYPE_DEFAULT ? path.join(location, "default.json") : (path.join(location, `${guild.id}.json`))).then(fileContents => {
				let parsedConfig = JSON.parse(fileContents);
				this._loadedConfigs.set(identifier, parsedConfig);
				return parsedConfig;
			});
		}
	}
	
	_readConfigFile(path) { //plz halp is underscore am doing right???
		console.log(`Reading config path ${path}`);
		
		return mzfs.readFile(path).then(fileContents => { //template string probably wasn't necessary. also assuming the extension is .json *could* be a problem one day maybe
			return fileContents;
		}, error => {
			if (error.code === "ENOENT") {
				return null;
			} else {
				throw error;
			}
		});
	}
}

module.exports = ConfigFetcher;
