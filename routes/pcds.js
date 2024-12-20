var express = require('express');
var router = express.Router();
let fs = require('fs');

router.get('/listPcdFiles', listPcdFiles);
router.get('/loadPcdBinary', loadPcdBinaryFile);
module.exports = router;

async function listPcdFiles(req, res, next) {
  let pcdFolder = 'pcds';
  let data = [];
  fs.readdirSync(pcdFolder).forEach(file => {
    data.push(file);
  });
  res.send({ total: data.length, file: data });
}

let readline = require('readline');
let protobufjs = require("protobufjs");
let pcdJson = require("../proto/pcd_data.json")
let pcdRoot = protobufjs.Root.fromJSON(pcdJson)
let pcdMessage = pcdRoot.lookupType("PcdData");

async function loadPcdBinaryFile(req, res, next) {
  let pcd = req.query.pcd;
  let fileStream = fs.createReadStream(`pcds/${pcd}`);
  let fileData = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let points = [];
  for await (const line of fileData) {
    let data = processPcdData(line);
    if (data == null) {
      continue;
    }
    points.push(...data);
  }

  let result = { idx: 1, name: pcd, point: points }
  let buff = pcdMessage.encode(pcdMessage.create(result)).finish();
  res.set('Content-Type', 'application/octet-stream');
  res.send(buff);
}

function processPcdData(line) {
  let data = line.split(/\s/)
  if (data.length != 4) {
    return null;
  }
  for (let i = 0; i < 4; i++) {
    if (!isNumeric(data[i])) {
      return null;
    }
  }
  return [Number(data[0]), Number(data[1]), Number(data[2])]
}

function isNumeric(str) {
  if (typeof str != "string") {
    return false;
  }
  return !isNaN(str) && !isNaN(parseFloat(str));
}