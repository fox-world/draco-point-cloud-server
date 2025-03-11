const moment = require('moment-timezone');
const pcd_tools = require('../tools/pcd_tools.js')
const draco_tools = require('../tools/draco_tools.js');
const fs = require('fs');

const pcdFolder = pcd_tools.pcdFolder;
const drcFolder = pcdFolder + '_drc';

async function convertDrcFiles(req, res, next) {
    draco_tools.convertDracoFiles(pcdFolder);
    let timeZone = moment.tz.guess();
    let formattedTime = moment().tz(timeZone).format('YYYY-MM-DD HH:mm:ss.SSS');
    res.send("Draco文件转化处理中:\t" + formattedTime);
}

async function listDrcFiles(req, res, next) {
    let data = [];
    fs.readdirSync(drcFolder).forEach(file => {
        data.push(file);
    });
    res.send({ total: data.length, file: data });
}

async function loadDrcFile(req, res, next) {
    let drc = req.query.drc;

    res.setHeader('Content-Disposition', `attachment; filename="${drc}"`);
    res.setHeader('Content-Type', 'text/plain');

    let fileStream = fs.createReadStream(`${drcFolder}/${drc}`);
    fileStream.pipe(res);
}

async function loadDrcBinaryFile(req, res, next) {
    let protobufjs = require("protobufjs");
    let pointJson = require("../proto/point_data.json")
    let pointRoot = protobufjs.Root.fromJSON(pointJson)
    let pointMessage = pointRoot.lookupType("PointData");
    let drc = req.query.drc;
    let buffers = fs.readFileSync(`${drcFolder}/${drc}`);
    let bytes = new Uint8Array(buffers);

    let result = { idx: 1, name: drc, points: bytes }
    let buff = pointMessage.encode(pointMessage.create(result)).finish();
    res.setHeader('Content-Disposition', `attachment; filename="${drc}"`);
    res.set('Content-Type', 'application/octet-stream');
    res.send(buff);
}

module.exports = {
    convertDrcFiles, listDrcFiles, loadDrcFile, loadDrcBinaryFile
}