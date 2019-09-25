@app
splay.land

@static

@ws

@tables
players
  playerId *String

messages
  playerId *String
  messageId **String
#  stream true

# Uncomment the following lines to deploy
# 'bucket' must be in the same region as 'region' (e.g. us-west-1)
# @aws
# region us-west-1
# bucket your-private-deploy-bucket
