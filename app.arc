@app
splayspace

@http
get /

@static

@tables
users
  userId *String
  
worlds
  worldId *String
  
resources
  resourceId *String

@tables-streams
users
worlds
resources

@websocket
connect
disconnect
default

@plugins
enhance
