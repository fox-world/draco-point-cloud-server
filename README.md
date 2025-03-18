`Draco` Point Cloud server

# Instructions

```bash
# start with defualt port 3000
npm start

# start with specified port
set PORT=8000 &&  npm start

# start with debug mode
set PORT=8000 && set DEBUG=draco-point-cloud-server:* && npm start

# start with watch
set PORT=8000 && nodemon ./bin/www

# generate protobuf json schema file
node ./node_modules/protobufjs-cli/bin/pbjs proto/pcd.proto -o proto/pcd_data.json
```

# Docker

```bash
# build image
docker build -t lucumt_draco_client:1.0 .

# run docker
docker run -d -p 8000:8000 --name draco_server lucumt_draco_client:1.0

# stop docker
docker stop draco_server && docker rm draco_server
```

# API

| Interface                        | Description                                                  |
| -------------------------------- | ------------------------------------------------------------ |
| `main/listPcdFiles`              | List all `pcd` files with `json` format                      |
| `main/loadPcdText?pcd=xxx.pcd`   | Download specify `pcd` file with `text` format               |
| `main/loadPcdBinary?pcd=xxx.pcd` | Download specify `pcd` file with `binary` format via `Protocol Buffers` |
| `main/convertPlyFiles`           | Convert `pcd` files to `ply` format inside specified folder  |
| `main/listPlyFiles`              | List all `ply` files with `json` format                      |
| `main/loadPly?ply=xxx.ply`       | Download specify `ply` file with `text` format               |
| `main/convertDrcFiles`           | Convert `ply` files to `drc` format inside specified folder  |
| `main/listDrcFiles`              | List all `drc` files with `json` format                      |
| `main/loadDrc?drc=xxx.drc`       | Download specify `drc` file with `binary` format directly    |
| `main/loadDrcBinary?drc=xxx.drc` | Download specify `drc` file with `binary` format via `Protocol Buffers` |

