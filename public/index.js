console.info('connecting to', WS_URL);
const ws = new WebSocket(WS_URL);

ws.onerror = (event) => console.error('ws error', event);
ws.onopen = (event) => console.info('ws open', event);
ws.onclose = (event) => console.warn('ws close', event);

ws.onmessage = (event) => {
	const { action, connectionId, message } = JSON.parse(event.data);
	console.log('ws message', action);
	const playersList = document.querySelector('#players ul');
	switch (action) {
		case 'arrival':
			const newListItem = document.createElement('li');
			newListItem.innerText = connectionId;
			newListItem.id = connectionId;
			playersList.appendChild(newListItem);
			break;

		case 'departure':
			const oldListItem = document.getElementById(connectionId);
			playersList.removeChild(oldListItem);
			break;

		case 'said':
			const chatList = document.querySelector('#chat ol');
			const newChatItem = document.createElement('li');
			newChatItem.innerText = message;
			chatList.appendChild(newChatItem);
			break;

		default:
			console.warn('unhandled action', action);
			break;
	}
};

const chatForm = document.querySelector('#chat form');
const chatField = document.querySelector('#chat textarea');
chatForm.addEventListener('submit', (event) => {
	event.preventDefault();
	ws.send(
		JSON.stringify({
			action: 'say',
			message: chatField.value,
		}),
	);
	chatField.value = '';
});
