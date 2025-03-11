const pcd_tools = require('../tools/pcd_tools.js')
const fs = require('fs');

const pcdFolder = pcd_tools.pcdFolder;

async function listPcdFiles(req, res, next) {
    let data = [];
    fs.readdirSync(pcdFolder).forEach(file => {
        data.push(file);
    });
    res.send({ total: data.length, file: data });
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

module.exports = {
    listPcdFiles, loadPcdTextFile, loadPcdBinaryFile
}