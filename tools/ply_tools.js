const fs = require("fs");
const path = require("path");
const readline = require('readline');
const log = require('simple-node-logger').createSimpleLogger();
const pcd_tools = require('./pcd_tools.js')

const convertPlyFiles = (srcFolder) => {
    let plyFolder = createPlyFolder(srcFolder);
    iterateFolder(srcFolder, plyFolder);
}

const createPlyFolder = (srcFolder) => {
    let plyFolder = srcFolder + '_ply';
    if (fs.existsSync(plyFolder)) {
        fs.rmSync(plyFolder, { recursive: true });
        log.info('删除文件夹: ' + plyFolder);
    }
    fs.mkdirSync(plyFolder);
    log.info('创建文件夹: ' + plyFolder);
    return plyFolder;
}

const iterateFolder = async (srcFolder, dstFolder) => {
    const files = fs.readdirSync(srcFolder);
    const promises = files.map(file => {
        log.info(file + ' 开始被解析');
        return convertToPlyFile(srcFolder, dstFolder, file);
    });
    await Promise.all(promises);
    log.info('--------------pcd转为ply全部处理完毕-----------------');
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

    fs.writeFileSync(plyPath, plyContent, { flag: 'w' });
    log.info(plyFile + ' 生成完毕');
}

module.exports = {
    convertPlyFiles
}