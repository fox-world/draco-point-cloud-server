const fs = require("fs");
const path = require("path");
const readline = require('readline');
const log = require('simple-node-logger').createSimpleLogger();
const pcd_tools = require('./pcd_tools.js')

const convertDracoFiles = (srcFolder) => {
    let dracoFolder = createDracoFolder(srcFolder);
    iterateFolder(srcFolder, dracoFolder);
}

const createDracoFolder = (srcFolder) => {
    let dracoFolder = srcFolder + '_drc';
    if (fs.existsSync(dracoFolder)) {
        fs.rmSync(dracoFolder, { recursive: true });
        log.info('删除文件夹:\t' + dracoFolder);
    }
    fs.mkdirSync(dracoFolder);
    log.info('重新创建文件夹:\t' + dracoFolder);
    return dracoFolder;
}

const iterateFolder = (srcFolder, dstFolder) => {
    fs.readdirSync(srcFolder).forEach((file, index) => {
        log.info(file + ' 开始被处理');
        convertToPlyFile(srcFolder, dstFolder, file);
    });
    log.info('--------------全部处理完毕-----------------');
}

const convertToPlyFile = async (srcFolder, dstFolder, file) => {
    let fileStream = fs.createReadStream(srcFolder + '/' + file);
    let fileData = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let points = [];
    for await (const line of fileData) {
        let point = pcd_tools.convertPcdToPlyData(line);
        if (!!point) {
            points.push(point);
        }
    }
    let pointSize = points.length;
    let headers = [
        'ply',
        'format ascii 1.0',
        'element vertex ' + pointSize,
        'property float x',
        'property float y',
        'property float z',
        'end_header'
    ];
    let plyData = [...headers, ...points];

    // 没有扩展名的文件名称
    let fileName = path.parse(file).name;
    let plyFile = fileName + '.ply';
    let plyPath = path.join(dstFolder, plyFile);
    let plyContent = plyData.join('\n') + '\n';

    fs.writeFile(plyPath, plyContent, { flag: 'w' }, (err) => {
        if (err) {
            throw err;
        }
        log.info(plyFile + ' 写入完毕');
    });
}

module.exports = {
    convertDracoFiles
}