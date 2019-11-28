const arc = require('@architect/functions');

exports.handler = connectHandler;

async function connectHandler(req) {
	const { connectionId } = req.requestContext;
	//console.log('connecting', connectionId);

	try {
		const { connections } = await arc.tables();

		// announce arrival to all players
		const { Items } = await connections.scan({});
		//console.log('Items', JSON.stringify(Items));
		Items.forEach(async (connection) => {
			const { connectionId: id } = connection;
			//console.log('announcing arrival to', id);
			await arc.ws.send({
				id,
				payload: { connectionId, action: 'arrival' },
			});
			//console.log('announced arrival to', id);

			// announce the presence of this player to the new player
			await arc.ws.send({
				id: connectionId,
				payload: {
					action: 'arrival',
					connectionId: id,
				},
			});
		});

		// store the connectionId in the db
		await connections.put({ connectionId });

		//console.log('connected', connectionId);
		return { statusCode: 200 };
	} catch (error) {
		console.error(error);
	}
}
