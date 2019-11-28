@app
splayspace

@aws
bucket splayspace
profile splayspace
region us-west-2
runtime nodejs12.x

@static

@ws

@http
get /env

@tables
connections
    connectionId *String
    