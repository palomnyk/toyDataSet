/**
 * Title: Fastq parser for selecting experimental groups and rarifying data
 * Author: Aaron Yerke [amyerke@uncc.edu, aaronyerke@gmail.com]
 * Start date: June 2019
 * Notes:
 * Cleaned-up from my toyDataSet git repository.
 * First input is fastq R1 path, second is fastq R1 path, third is rarifier path.
 * 
 * hpc available modules: module avail
 * hpc load node: module load node.js/4.4.0
 */

"use strict"

if (process.argv.length != 4) {
  throw "ERROR: Enter the proper number arguments.";
}

//import libraries
const fs = require('fs'),
  path = require('path'),
  readline = require('readline'),
  execSync = require('child_process').execSync;

//CLI Arguments
const procArgs = process.argv.slice(2),
  READ1 = procArgs[0],
  rarify = procArgs[1]; //take 1 out of X sequences

//how many seqs have been parsed so far
let seqCounter = 0;
let totalLineCount = 0;

/**
 * Read through the fastqR1, get the selected sequences, print them to R1 output,
 * grep matching IDs in fastqR2, write them to R2 output
 * @param {*} fastqR1 
 */
function createSubsamples(fastqR1) {

  //create generator for reading lines one at a time
  let rl = readline.createInterface({
    input : fs.createReadStream(path.join('.', fastqR1)),
    output : new (require('stream'))(),
  });

  console.log(`Working from ${process.cwd()}`);
  
  //Create place to write new sequence files
  let sampleDir = path.join('.',`fastqSampler${rarify}`);

  //make folders for files
  if (!fs.existsSync(sampleDir)){
    fs.mkdirSync(sampleDir);
  }
  const outputR1 = fs.createWriteStream(path.join(sampleDir,`reduced${rarify}${path.basename(fastqR1)}`), { flags: 'a' });
  let lineCount = 0;

  //empty fastq object
  let fastqSeq = {
    header : null,
    seq : null,
    optLine : '+', //this is usually a '+', and it shouldn't matter, until it does matter..
    score : null,
    barcode : null,
    returnFastq : function() {
      try {
        return `${this.header}\n${this.seq}\n${this.optLine}\n${this.score}\n`
      } catch (err) {
        console.error(err);
      }
    },
    checkSeqComplete : function(){
      if (this.header != null && this.seq != null && this.score != null) {
        return true;
      } else {
        return false;
      }
    },
  };

  rl.on('line', function (line) {
    
    if (lineCount === 0) {
      if (!line.startsWith('@')) {
        throw "this fastq doesn't start with '@'. Cannot proceed.";
      }
      fastqSeq.header = line;
      //fastqSeq.barcode = line.split('N:0:')[1];
    }else{
      if (lineCount === 1) {
        fastqSeq.seq = line;
      }
      if (lineCount === 2) {
        fastqSeq.optLine = line;
      }
      if (lineCount === 3) {
        fastqSeq.score = line;
        seqCounter += 1;
        /**
         * Action happens here! At this point, we should have a full fastqSeq
         */
         if (seqCounter % rarify === 0) {
          let fq1 = fastqSeq.returnFastq();
          // console.log(fq1);
          outputR1.write(fq1);
         }
        lineCount = -1;
      }
    }
    lineCount += 1;
    totalLineCount += 1;
  });

  rl.on('close', function () {
    console.log('Done reading files.');
    console.log(`R1.fastq had ${seqCounter} sequences and ${totalLineCount} lines`);
  });

}//end processFile

createSubsamples(READ1);