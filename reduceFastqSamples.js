/**
 * Title: Fastq parser for selecting experimental groups and rarifying data
 * Author: Aaron Yerke
 * Start date: June 2019
 * Notes:
 * grep --color 'CGAGCTGTTACC' headR1.fastq
 * scp amyerke@hpc.uncc.edu:/users/amyerke/toydataset/gastricToy/test1/headR1.txt .
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
  'TATGTGCCGGCT',
  'TGGTCGCATCGT',
  'TGTAAGACTTGG',
  'CGGATCTAGTGT',
  'CGATCTTCGAGC',
  'GTCGAATTTGCG',
  'CTGGAAATCTGCA'
]

//Create place to write new sequence files
const output = fs.createWriteStream('renameOutput.fastq', { flags: 'a' });

/**
 * Read through the file, add selected barcodes to output
 * @param {*} inputFile 
 */
function processFile(inputFile) {
  let instream = fs.createReadStream(inputFile),
    outstream = new (require('stream'))(),
    rl = readline.createInterface(instream, outstream);

  rl.on('line', function (line) {
    if (line.startsWith('@M0') && barcodeCheck(line)) {
      console.log(line);
      output.write(line)
    }
  });

  rl.on('close', function (line) {
    console.log("rl.on('close': ", line);
    console.log('done reading file.');
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