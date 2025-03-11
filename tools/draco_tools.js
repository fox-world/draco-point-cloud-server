const fs = require("fs");
const path = require("path");
const readline = require('readline');
const log = require('simple-node-logger').createSimpleLogger();
const pcd_tools = require('./pcd_tools.js')

const draco3d = require('draco3d');

const convertDracoFiles = (srcFolder) => {
    let plyFolder = createPlyFolder(srcFolder);
    iterateFolder(srcFolder, plyFolder);
}

const createPlyFolder = (srcFolder) => {
    let plyFolder = srcFolder + '_drc';
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
    const promises = files.slice(0, 1).map((file) => {
        log.info(file + ' 开始被解析');
        return convertToDrcFile(srcFolder, dstFolder, file);
    });
    await Promise.all(promises);
    log.info('--------------pcd转为ply全部处理完毕-----------------');
}

const convertToDrcFile = async (srcFolder, dstFolder, file) => {
    let fileStream = fs.createReadStream(srcFolder + '/' + file);
    let fileData = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let points = [];
    for await (const line of fileData) {
        let point = pcd_tools.convertPcdToPlyData(line);
        if (!!point) {
            points = points.concat(point);
        }
    }
    let pointSize = points.length;

    let encoderModule = null, encoder = null;
    draco3d.createEncoderModule({}).then(function (module) {
        encoderModule = module;
        log.info('Encoder Module Initialized!');

        encoder = new encoderModule.Encoder();
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

        log.info(`${file} begin to encoding...`);
        let encodedLen = encoder.EncodePointCloudToDracoBuffer(newPointCloud, false, encodedData);
        encoderModule.destroy(newPointCloud);

        if (encodedLen > 0) {
            log.info(`${file} encoding length: ` + encodedLen);
        } else {
            log.error(`${file} encoding failed `);
        }

        let fileName = path.parse(file).name;
        let drcFile = fileName + '.drc';
        let drcPath = path.join(dstFolder, drcFile);

        let outputBuffer = new ArrayBuffer(encodedLen);
        let outputData = new Int8Array(outputBuffer);
        for (let i = 0; i < encodedLen; ++i) {
            outputData[i] = encodedData.GetValue(i);
        }

        fs.writeFile(drcPath, Buffer.from(outputBuffer), 'binary',
            function (err) {
                if (err) {
                    log.info(err);
                } else {
                    log.info(`${drcFile} was create and saved success!`);
                }
            });

        encoderModule.destroy(encoder);
    });
}

module.exports = {
    convertDracoFiles
}