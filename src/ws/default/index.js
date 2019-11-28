const arc = require('@architect/functions');

exports.handler = defaultHandler;

async function defaultHandler(req) {
	const { action, message } = JSON.parse(req.body);
	const { connectionId } = req.requestContext;
	console.info('default', action);

	//if (action === 'say')
	// send the message to all the connected players
	try {
		const { connections } = await arc.tables();
		const { Items } = await connections.scan({});
		Items.forEach(async (connection) => {
			const { connectionId: id } = connection;
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
