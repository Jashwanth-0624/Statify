// Vercel serverless handler for Node.js runtime
// serverless-http converts the Express app into a handler Vercel can invoke

const serverless = require('serverless-http');
const app = require('../server');

// Export the handler (Vercel calls this function for each request)
// Export both forms to maximize compatibility with different runtime expectations.
const handler = serverless(app);
module.exports = handler;
module.exports.handler = handler;
