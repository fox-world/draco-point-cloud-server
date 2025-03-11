const fs = require("fs");
const path = require("path");
const readline = require('readline');
const log = require('simple-node-logger').createSimpleLogger();
const pcd_tools = require('./pcd_tools.js');
const pLimit = require('p-limit').default; // 引入 p-limit

const { styleText } = require('node:util');

const draco3d = require('draco3d');

const convertDracoFiles = (srcFolder) => {
    let drcFolder = createDrcFolder(srcFolder);
    iterateFolder(srcFolder, drcFolder);
}

function createDrcFolder(srcFolder) {
    let drcFolder = srcFolder + '_drc';
    if (fs.existsSync(drcFolder)) {
        fs.rmSync(drcFolder, { recursive: true });
        log.info(`删除文件夹: ${drcFolder}`);
    }
    fs.mkdirSync(drcFolder);
    log.info(`创建文件夹: ${drcFolder}`);
    return drcFolder;
}

const iterateFolder = async (srcFolder, dstFolder) => {
    let limit = pLimit(3); // 限制并发数为 3

    draco3d.createEncoderModule({}).then(function (encoderModule) {
        encoder = new encoderModule.Encoder();
        let files = fs.readdirSync(srcFolder);

        // 使用 p-limit 控制并发
        let startTime = new Date();
        let promises = files.map((file) => {
            return limit(() => {
                log.info(file + ' 开始被解析');
                return convertToDrcFile(srcFolder, dstFolder, file, encoderModule, encoder);
            });
        });

        Promise.all(promises).then(() => {
            let endTime = new Date();
            let elapsedTime = (endTime - startTime) / 1000;

            log.info(styleText('green', `--------------pcd转为drc全部处理完毕,总耗时:${elapsedTime}s`));
            encoderModule.destroy(encoder);
        }).catch((err) => {
            log.error('处理文件时出错: ', err);
        });
    });
}

const convertToDrcFile = async (srcFolder, dstFolder, file, encoderModule, encoder) => {
    let fileStream = fs.createReadStream(srcFolder + '/' + file);
    let fileData = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let points = [];
    for await (const line of fileData) {
        let point = pcd_tools.convertPcdToPointCloudData(line);
        if (!!point) {
            points = points.concat(point);
        }
    }
    let pointSize = points.length;

    const pointCloudBuilder = new encoderModule.PointCloudBuilder();
    const newPointCloud = new encoderModule.PointCloud();

    const attrs = { POSITION: 3 };
    Object.keys(attrs).forEach((attr) => {
        const stride = attrs[attr];
        const numValues = pointSize;
        const numPoints = numValues / stride;
        const encoderAttr = encoderModule[attr];

        const attributeDataArray = new Float32Array(numValues);
        for (let i = 0; i < numValues; ++i) {
            attributeDataArray[i] = points[i];
        }
        pointCloudBuilder.AddFloatAttribute(newPointCloud, encoderAttr, numPoints, stride, attributeDataArray);
    });

    let encodedData = new encoderModule.DracoInt8Array();
    encoder.SetSpeedOptions(5, 5);
    encoder.SetAttributeQuantization(encoderModule.POSITION, 10);
    encoder.SetEncodingMethod(encoderModule.MESH_EDGEBREAKER_ENCODING);

    log.info(`${file} 开始编码...`);
    let encodedLen = encoder.EncodePointCloudToDracoBuffer(newPointCloud, false, encodedData);
    encoderModule.destroy(newPointCloud);

    if (encodedLen > 0) {
        log.info(`${file} 编码后长度: ` + encodedLen);
    } else {
        log.error(`${file} 编码失败 `);
    }

    let fileName = path.parse(file).name;
    let drcFile = fileName + '.drc';
    let drcPath = path.join(dstFolder, drcFile);

    let outputBuffer = new ArrayBuffer(encodedLen);
    let outputData = new Int8Array(outputBuffer);
    for (let i = 0; i < encodedLen; ++i) {
        outputData[i] = encodedData.GetValue(i);
    }

    return new Promise((resolve, reject) => {
        fs.writeFile(drcPath, Buffer.from(outputBuffer), 'binary',
            function (err) {
                if (err) {
                    log.info(err);
                    reject(err);
                } else {
                    log.info(styleText('yellow', `${drcFile} 成功创建并保存!`));
                    resolve();
                }
            });
    }).finally(() => {
        encoderModule.destroy(encodedData);
        encoderModule.destroy(pointCloudBuilder);
    });
}

module.exports = {
    convertDracoFiles
}