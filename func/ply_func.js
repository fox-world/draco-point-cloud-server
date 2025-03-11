const moment = require('moment-timezone');
const pcd_tools = require('../tools/pcd_tools.js')
const ply_tools = require('../tools/ply_tools.js');
const fs = require('fs');

const pcdFolder = pcd_tools.pcdFolder;
const plyFolder = pcdFolder + '_ply';

async function listPlyFiles(req, res, next) {
    let data = [];
    fs.readdirSync(plyFolder).forEach(file => {
        data.push(file);
    });
    res.send({ total: data.length, file: data });
}

async function loadPlyFile(req, res, next) {
    let ply = req.query.ply;

    res.setHeader('Content-Disposition', `attachment; filename="${ply}"`);
    res.setHeader('Content-Type', 'text/plain');

    let fileStream = fs.createReadStream(`${plyFolder}/${ply}`);
    fileStream.pipe(res);
}

async function convertPlyFiles(req, res, next) {
    ply_tools.convertPlyFiles(pcdFolder);
    let timeZone = moment.tz.guess();
    let formattedTime = moment().tz(timeZone).format('YYYY-MM-DD HH:mm:ss.SSS');
    res.send("Ply文件转化成功:\t" + formattedTime);
}

module.exports = {
    convertPlyFiles, listPlyFiles, loadPlyFile
}