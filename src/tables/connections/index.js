const arc = require('@architect/functions');

exports.handler = connectionsHandler;

async function connectionsHandler(event) {
	console.info('connections changed', event);
	const { connections } = await arc.tables();
	const res = await connections.scan({});
	console.log('all connections', res);
	return;
}
