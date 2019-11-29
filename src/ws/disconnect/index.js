const arc = require('@architect/functions');

exports.handler = disconnectHandler;

async function disconnectHandler(req) {
	const { connectionId } = req.requestContext;
	console.log('disconnecting', connectionId);

	try {
		const { connections } = await arc.tables();

		// remove the connection from the db
		await connections.delete({ connectionId });

		// announce the departure to all players
		const { Items } = await connections.scan({});
		//console.log('Items', JSON.stringify(Items));
		const payload = { connectionId, action: 'departure' };
		Items.forEach(async (connection) => {
			const { connectionId: id } = connection;
			await arc.ws.send({ id, payload });
			console.log('announced departure to', id);
		});

		console.log('disconnected', connectionId);
		return { statusCode: 200 };
	} catch (error) {
		console.error(error);
	}
}
