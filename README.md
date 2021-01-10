# adrobot
Mediocre bot for Discord

## Required data
The `matchup` and `predict` commands require a list of community members to operate. This list should be a JSON array stored in `common-data/community-members.json`, and is not included in this repository in order to avoid any potential controversy over which community members are and are not on said list.

## Running Adrobot

```bash
npm install
npm run bootstrap
npm start -- [your token] # the extra dashes are necessary
```
