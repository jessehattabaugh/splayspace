exports.handler = envHandler;

async function envHandler() {
	return {
		headers: { 'content-type': 'text/javascript; charset=utf8' },
		body: `window.WS_URL = "ws://${process.env.ARC_WSS_URL ||
			'localhost:3333'}";`,
	};
}
