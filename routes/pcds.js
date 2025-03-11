const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const fs = require('fs');

const pcd_tools = require('../tools/pcd_tools.js')
const ply_tools = require('../tools/ply_tools.js');
const draco_tools = require('../tools/draco_tools.js');

const pcdFolder = 'data/pcds_big';
const plyFolder = pcdFolder + '_ply';
const drcFolder = pcdFolder + '_drc';

router.get('/listPcdFiles', listPcdFiles);
router.get('/listPlyFiles', listPlyFiles);
router.get('/listDrcFiles', listDrcFiles);

router.get('/loadPcdText', loadPcdTextFile);
router.get('/loadPcdBinary', loadPcdBinaryFile);
router.get('/loadPly', loadPlyFile);

router.get('/convertPlyFiles', convertPlyFiles);
router.get('/convertDrcFiles', convertDrcFiles);

module.exports = router;

//=================文件转化相关======================
async function convertPlyFiles(req, res, next) {
  ply_tools.convertPlyFiles(pcdFolder);
  let timeZone = moment.tz.guess();
  let formattedTime = moment().tz(timeZone).format('YYYY-MM-DD HH:mm:ss.SSS');
  res.send("Ply文件转化成功:\t" + formattedTime);
}

async function convertDrcFiles(req, res, next) {
  draco_tools.convertDracoFiles(pcdFolder);
  let timeZone = moment.tz.guess();
  let formattedTime = moment().tz(timeZone).format('YYYY-MM-DD HH:mm:ss.SSS');
  res.send("Draco文件转化处理中:\t" + formattedTime);
}

//=================文件列表相关======================
async function listPcdFiles(req, res, next) {
  let data = [];
  fs.readdirSync(pcdFolder).forEach(file => {
    data.push(file);
  });
  res.send({ total: data.length, file: data });
}

async function listPlyFiles(req, res, next) {
  let data = [];
  fs.readdirSync(plyFolder).forEach(file => {
    data.push(file);
  });
  res.send({ total: data.length, file: data });
}

async function listDrcFiles(req, res, next) {
  let data = [];
  fs.readdirSync(drcFolder).forEach(file => {
    data.push(file);
  });
  res.send({ total: data.length, file: data });
}

//=================文件加载相关======================
async function loadPlyFile(req, res, next) {
  let pcd = req.query.pcd;

  res.setHeader('Content-Disposition', `attachment; filename="${pcd}"`);
  res.setHeader('Content-Type', 'text/plain');

  let fileStream = fs.createReadStream(`${plyFolder}/${pcd}`);
  fileStream.pipe(res);
}

async function loadPcdTextFile(req, res, next) {
  let pcd = req.query.pcd;

  res.setHeader('Content-Disposition', `attachment; filename="${pcd}"`);
  res.setHeader('Content-Type', 'text/plain');

  let fileStream = fs.createReadStream(`${pcdFolder}/${pcd}`);
  fileStream.pipe(res);
}

async function loadPcdBinaryFile(req, res, next) {
  let readline = require('readline');
  let protobufjs = require("protobufjs");
  let pcdJson = require("../proto/pcd_data.json")
  let pcdRoot = protobufjs.Root.fromJSON(pcdJson)
  let pcdMessage = pcdRoot.lookupType("PcdData");
  let pcd = req.query.pcd;
  let fileStream = fs.createReadStream(`${pcdFolder}/${pcd}`);
  let fileData = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let points = [];
  for await (const line of fileData) {
    let data = pcd_tools.convertPcdToPointCloudData(line);
    if (data == null) {
      continue;
    }
    points.push(...data);
  }

  let result = { idx: 1, name: pcd, point: points }
  let buff = pcdMessage.encode(pcdMessage.create(result)).finish();
  res.setHeader('Content-Disposition', `attachment; filename="${pcd}"`);
  res.set('Content-Type', 'application/octet-stream');
  res.send(buff);
}