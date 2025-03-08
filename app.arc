@app
splayspace

@http
get /

@static
fingerprint true

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

@aws
runtime nodejs18.x
architecture arm64
region us-west-2
