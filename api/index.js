// Vercel serverless handler for Node.js runtime
// serverless-http converts the Express app into a handler Vercel can invoke

const serverless = require('serverless-http');
const app = require('../server');

// Create the serverless handler
const handler = serverless(app);

// Provide a lightweight bypass for health checks so we can quickly detect
// whether the function is starting and responding without invoking Express.
// Vercel may call the exported function with (req, res) signatures.
module.exports = async function (req, res) {
	try {
		const url = (req && (req.url || req.path)) || '';
		if (url && url.startsWith('/health')) {
			res.setHeader('content-type', 'application/json');
			return res.end(JSON.stringify({ ok: true, bypass: true }));
		}
	} catch (e) {
		// ignore and continue to full handler
	}

	// Fallback to the full Express app for other routes
	return handler(req, res);
};

// Also export .handler for runtimes that expect that property
module.exports.handler = handler;
