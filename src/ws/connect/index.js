// learn more about WebSocket functions here: https://arc.codes/primitives/ws
exports.handler = async function subscribe(payload) {
  console.log(JSON.stringify(payload, null, 2))
  return {statusCode: 200}
}