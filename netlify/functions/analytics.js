const serverless = require('serverless-http');
const { analyticsApp } = require('../../mock-server');

module.exports.handler = serverless(analyticsApp);
