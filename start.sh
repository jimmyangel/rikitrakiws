#!/bin/bash
MONGO_PWD=`curl http://metadata.google.internal/computeMetadata/v1/instance/attributes/bitnami-base-password -H "Metadata-Flavor: Google" 2>/dev/null`
export MONGODB_DB_URL=mongodb://root:$MONGO_PWD@127.0.0.1/rikitraki?authSource=admin
export MAILGUN_API_KEY=`curl http://metadata.google.internal/computeMetadata/v1/instance/attributes/mailgun-api-key -H "Metadata-Flavor: Google" 2>/dev/null`
export JWT_SECRET=`curl http://metadata.google.internal/computeMetadata/v1/instance/attributes/jwt-secret -H "Metadata-Flavor: Google" 2>/dev/null`
nohup node rikitrakiws.js >rikitrakiws.log &

