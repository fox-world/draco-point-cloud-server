var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/loadPcdBinary', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;


var fs = require('fs');
var readline = require('readline');

async function processPcdFile() {
  const fileStream = fs.createReadStream('input.txt');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    console.log(`Line from file: ${line}`);
  }
}

processLineByLine();
