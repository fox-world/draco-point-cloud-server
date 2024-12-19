`Draco` Point Cloud server

```bash
# start with defualt port 3000
npm start

# start with specified port
set PORT=8000 &&  npm start

# start with debug mode
set PORT=8000 && set DEBUG=draco-point-cloud-server:* && npm start

# start with watch
set PORT=8000 && nodemon ./bin/www
```

