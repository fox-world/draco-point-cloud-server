const express = require('express');
const router = express.Router();

const pcd_func = require('../func/pcd_func.js');
const ply_func = require('../func/ply_func.js');
const drc_func = require('../func/drc_func.js');

router.get('/listPcdFiles', pcd_func.listPcdFiles);
router.get('/loadPcdText', pcd_func.loadPcdTextFile);
router.get('/loadPcdBinary', pcd_func.loadPcdBinaryFile);

router.get('/convertPlyFiles', ply_func.convertPlyFiles);
router.get('/listPlyFiles', ply_func.listPlyFiles);
router.get('/loadPly', ply_func.loadPlyFile);

router.get('/convertDrcFiles', drc_func.convertDrcFiles);
router.get('/listDrcFiles', drc_func.listDrcFiles);
router.get('/loadDrc', drc_func.loadDrcFile);
router.get('/loadDrcBinary', drc_func.loadDrcBinaryFile);

module.exports = router;