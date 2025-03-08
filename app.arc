@app
splayspace

@http
# Define HTTP routes here if needed

@ws
connect
default
disconnect
websocket

@tables
users
  id *String

worlds
  id *String

resources
  id *String

@aws
# Load WebSocket API ID from preferences if available
prefs
  WEBSOCKET_API_ID

# Removes hard-coded value and uses preference
apigateway
  websocketApiId $WEBSOCKET_API_ID
  websocketApiRouteSelectionExpression $request.body.action
