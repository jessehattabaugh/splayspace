exports.handler = envHandler;

async function envHandler() {
	return {
		headers: { 'content-type': 'text/javascript; charset=utf8' },
		body: `window.ARC_WS_URL = "${process.env.ARC_WS_URL ||
			'ws://localhost:3333'}";`,
	};
}
