const fs = require('fs'),
  path = require('path'),
  readline = require('readline');

function processFile(inputFile) {
  let instream = fs.createReadStream(inputFile),
    outstream = new (require('stream'))(),
    rl = readline.createInterface(instream, outstream);

  rl.on('line', function (line) {
    console.log(line);
  });

  rl.on('close', function (line) {
    console.log(line);
    console.log('done reading file.');
  });
}
processFile(path.join('.', 'headGastricR1.fastq'));