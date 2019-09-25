exports.handler = async function handleWebSocketDisconnect(event) {
	console.log('🎃', 'disconnect', event);

	// remove the player from the player table

	return {statusCode: 200};
};
