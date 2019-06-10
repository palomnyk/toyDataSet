/**
 * Title: Fastq parser for selecting experimental groups and rarifying data
 * Author: Aaron Yerke
 * Start date: June 2019
 * Notes:
 * hpc available modules: module avail
 * hpc load node: module load node.js/4.4.0
 * grep --color 'CGAGCTGTTACC' headR1.fastq
 * scp username@hpc.uncc.edu:/users/amyerke/toydataset/gastricToy/test1/headR1.txt .
 */

"use strict"
 //import libraries
const fs = require('fs'),
  path = require('path'),
  readline = require('readline');

//take 1 out of X sequences
const rarify = 200;

const keeperBarCodes = [
  'CTGAAGGGCGAA',
  'CGCTCACAGAAT',
  'CGAGCTGTTACC',
  // 'TATGTGCCGGCT',
  // 'TGGTCGCATCGT',
  // 'TGTAAGACTTGG',
  // 'CGGATCTAGTGT',
  // 'CGATCTTCGAGC',
  // 'GTCGAATTTGCG',
  // 'CTGGAAATCTGCA'
]

/**
 * Read through the file, add selected barcodes to output
 * @param {*} inputFile 
 */
function processFile(inputFile) {
  //create generator for reading lines one at a time
  let rl = readline.createInterface({
    input : fs.createReadStream(inputFile),
    output : new (require('stream'))(),
  });

  //Create place to write new sequence files
  const output = fs.createWriteStream('rename'.concat(path.basename(inputFile)), { flags: 'a' });

  let lineCount = 0;

  rl.on('line', function (line) {
    if (lineCount > 0) {
      console.log(line);
      output.write(line + '\n');
      lineCount -= 1;
    } 
    else if (line.startsWith('@M0') && barcodeCheck(line)) {
      console.log(line);
      output.write(line + '\n');
      lineCount = 3;
    }
  });

  rl.on('close', function (line) {
    console.log("rl.on('close': ", line);
    console.log('done reading file.');
    // instream.end();
    // output.end();
    // console.log('closed files');
    
  });
}

/**
 * Test if line ends in one of our selected barcodes
 * @param {*} line 
 * 
 */
function barcodeCheck(line) {
  for (const element of keeperBarCodes) {
    if (line.endsWith(element)) {
      return true;
    }
  }
  return false;
}


processFile(path.join('.', 'headR1.fastq'));