var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Draco点云测试',
    description: '利用Draco对点云数据进行编码/解码，以减少数据体积并提高网络传输性能'
  });
});

module.exports = router;