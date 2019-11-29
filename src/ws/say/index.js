const arc = require('@architect/functions');

exports.handler = sayHandler;

async function sayHandler(req) {
	const { action, message } = JSON.parse(req.body);
	const { connectionId } = req.requestContext;
	console.info('default', action);

	// send the message to all the connected players
	try {
		const { connections } = await arc.tables();
		const { Items } = await connections.scan({});
		Items.forEach(async (connection) => {
			const { connectionId: id } = connection;
			console.log(`${connectionId} saying "${message}" to ${id}`);
			await arc.ws.send({
				id,
				payload: { action: 'said', connectionId, message },
			});
		});
	} catch (error) {
		console.error(error);
	}

	return { statusCode: 200 };
}
