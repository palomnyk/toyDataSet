/**
 * Title: Fastq parser for selecting experimental groups and rarifying data
 * Author: Aaron Yerke
 * Start date: June 2019
 * Notes:
 * First input is fastq R1 path, second is fastq R1 path, third is rarifier path.
 * 
 * 
 * hpc available modules: module avail
 * hpc load node: module load node.js/4.4.0
 * grep 'AGCCGGCACATA' gasBP_R1.fastq | wc
 * scp amyerke@hpc.uncc.edu:/users/amyerke/toydataset/gastricToy/test1/toyDataSet/renamegasBP_R1.fastq ./resultGasBP_R1.fastq
 */

"use strict"

if (process.argv.length != 5) {
  console.error("ERROR: Enter the proper number arguments.");
  process.exit(1);
}

//import libraries
const fs = require('fs'),
  path = require('path'),
  readline = require('readline'),
  execSync = require('child_process').execSync;

//CLI Arguments
const procArgs = process.argv.slice(2),
  READ1 = procArgs[0],
  READ2 = procArgs[1],
  rarify = procArgs[1]; //take 1 out of X sequences

//for counting barcodes in a multiplexed dataset
let barcodeCount = {};

//the barcodes that we want to keep
let keeperBarCodes = [
  'CTGAAGGGCGAA',
  'CGCTCACAGAAT',
  'CGAGCTGTTACC',
];

//how many seqs have been parsed so far
let seqCounter = 0;

//Some of the barcodes can only be found as the barcode
keeperBarCodes = addRevCompToList(keeperBarCodes);

/**
 * Read through the fastqR1, get the selected sequences, print them to R1 output,
 * grep matching IDs in fastqR2, write them to R2 output
 * @param {*} fastqR1 
 */
function processFile(fastqR1, fastqR2) {

  //create generator for reading lines one at a time
  let rl = readline.createInterface({
    input : fs.createReadStream(fastqR1),
    output : new (require('stream'))(),
  });
  
  //Create place to write new sequence files
  const outputR1 = fs.createWriteStream('rename' + (path.basename(fastqR1)), { flags: 'a' });
  const outputR2 = fs.createWriteStream('rename' + (path.basename(fastqR2)), { flags: 'a' });

  let lineCount = 0;

  //empty fastq object
  let fastqSeq = {
    // header : null,
    // seq : null,
    // score : null,
    // barcode : null,
    returnFastq : function() {
      try {
        console.log(this.header + '\n' + this.seq + '\n+\n' + this.score);
        
        return this.header + '\n' + this.seq + '\n+\n' + this.score;
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
    checkSeqStartWithPrimers : function(){
      /**
       * Need sequences that only start with:
       * ^TTACCGCGGC[GT]GCTGGCACTC
       * ^ATTAGA[AT]ACCC[TCG][TAG]GTAGTCCGT
       */
      const primerStartSeqs = [
        /^TTACCGCGGC[GT]GCTGGCACTC/,
        /^ATTAGA[AT]ACCC[TCG][TAG]GTAGTCCGT/
      ];
      return primerStartSeqs.some(primer => this.seq.match(primer));
    }
  };

  rl.on('line', function (line) {
    if (line.startsWith('@M0')) {
      fastqSeq.header = line;
      fastqSeq.barcode = line.split('N:0:')[1];
      lineCount = 4;
    }else{
      if (lineCount === 3) {
        fastqSeq.seq = line;
      }
      if (lineCount === 1) {
        fastqSeq.score = line;
        seqCounter += 1;
        /**
         * Action happens here! At this point, we should have a full fastqSeq
         */
        console.log(seqCounter, ' ', rarify);

         if (seqCounter % rarify === 0) {
          let fq = fastqSeq.returnFastq();
          console.log(fq);
          outputR1.write(fq);



         }

        //console.log('checkSeqStartWithPrimers', fastqSeq.checkSeqStartWithPrimers());
        //console.log('fastqSeq.checkSeqComplete() ', fastqSeq.checkSeqComplete());
        //console.log('fastqSeq.barcode',fastqSeq.barcode);
        //console.log('fastqSeq.returnFastq() ', fastqSeq.returnFastq());
      }
    }
    lineCount -= 1;
  });

  rl.on('close', function (line) {
    console.log("rl.on('close': ", line);
    console.log('done reading file.');
    // instream.end();
    // output.end();
    // console.log('closed files');
  });

  /**
   * Test if line ends in one of our selected barcodes
   * @param {*} line 
   */
  function barcodeCheck(line) {
    for (const element of keeperBarCodes) {
      if (line.endsWith(element)) {
        return true;
      }
    }
    return false;
  }

}//end processFile

function addRevCompToList(bcArray) {

  let emptyArr = [];
  
  function revComp(bc){
    const rc = bc.split('')
      .reverse()
      .join('')
      .toUpperCase()
      .replace(/A/g, 't')
      .replace(/T/g, 'a')
      .replace(/C/g, 'g')
      .replace(/G/g, 'c')
      .toUpperCase();
    
    return rc;
  }

  bcArray.forEach( bc => {
    emptyArr.push(revComp(bc))
  })
  return bcArray.concat(emptyArr);
}//end addRevCompToList

function isMultiple(baseMultiple, tester) {
  return baseMultiple % test === 0;
}

processFile(READ1,READ2);