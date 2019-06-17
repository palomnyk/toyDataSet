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
  rarify = procArgs[2]; //take 1 out of X sequences

//how many seqs have been parsed so far
let seqCounter = 0;
let totalLineCount = 0;

/**
 * Read through the fastqR1, get the selected sequences, print them to R1 output,
 * grep matching IDs in fastqR2, write them to R2 output
 * @param {*} fastqR1 
 * 
 * @param {*} fastqR2
 */
function createSubsamples(fastqR1, fastqR2) {

  //create generator for reading lines one at a time
  let rl = readline.createInterface({
    input : fs.createReadStream(fastqR1),
    output : new (require('stream'))(),
  });

  console.log(`Working from ${process.cwd()}`);
  
  
  //Create place to write new sequence files
  let sampleDir = `fastqSampler${rarify}`;



  if (!fs.existsSync(path.join('.','..',sampleDir))){
    fs.mkdirSync(path.join('.','..',sampleDir));
  }
  const outputR1 = fs.createWriteStream(path.join('.','..',`${sampleDir}`,`reduced${rarify}${path.basename(fastqR1)}`), { flags: 'a' });
  const outputR2 = fs.createWriteStream(path.join('.','..',`${sampleDir}`,`reduced${rarify}${path.basename(fastqR2)}`), { flags: 'a' });

  let lineCount = 0;

  //empty fastq object
  let fastqSeq = {
    header : null,
    seq : null,
    score : null,
    barcode : null,
    returnFastq : function() {
      try {
        return this.header + '\n' + this.seq + '\n+\n' + this.score + '\n';
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
    if (line.startsWith('@ER')) {
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

         if (seqCounter % rarify === 0) {
          let fq1 = fastqSeq.returnFastq();
          //console.log(fq1);
          outputR1.write(fq1);

          try {
            let grp = execSync(`grep '${fastqSeq.header.split(' length')[0]}' -A 3 ${fastqR2}`, {
              shell: '/bin/bash',
              detached: false,
            });
            outputR2.write(grp);
          } catch (error) {
            console.error(error);
          }


         }
      }
    }
    lineCount -= 1;
    totalLineCount += 1;
  });

  rl.on('close', function () {
    console.log('Done reading files.');
    console.log(`R1.fastq had ${seqCounter} sequences and ${totalLineCount} lines`);
  });

}//end processFile


createSubsamples(READ1,READ2);