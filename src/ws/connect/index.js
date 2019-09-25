exports.handler = async function handleWebSocketConnect(event) {
	const connectedAt = new Date(Date.now()).toISOString();

	const {apiId, connectionId} = event.requestContext;
	console.debug(
		'🎮',
		'connectionId:',
		connectionId,
		'apiId:',
		apiId,
		'body:',
		event.body,
	);

	// store connectionId in a cookie/session

	// generate an id for the player
	const Hashids = require('hashids');
	const hashids = new Hashids('splay.land');
	const playerId = hashids.encode(connectionId);

	// write a player to the player table
	const arc = require('@architect/functions');
	const {players} = await arc.tables();
	const res = await players.put({playerId, connectedAt, connectionId});
	console.debug('🎉', res);
	return {statusCode: 200};
};
