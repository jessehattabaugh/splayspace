// learn more about WebSocket functions here: https://arc.codes/primitives/ws
exports.handler = async function defaultWebSocketHandler(event) {
	console.log('🍩', 'default', event);

	// add text to the messages table

	return {statusCode: 200};
};
