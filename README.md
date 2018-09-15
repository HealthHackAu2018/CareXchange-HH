conda create -n carex -c conda-forge nodejs redis mongodb
source activate carex
npm install

# run these as two foreground windows
redis-server
mongod

# lauch node
node server.js

# note you will need the config.json posted in Slack