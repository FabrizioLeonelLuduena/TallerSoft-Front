const serverless = require('serverless-http');
const { mainApp } = require('../../mock-server');

module.exports.handler = serverless(mainApp);
