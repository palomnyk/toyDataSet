#!/bin/bash

# Useful commands:
# grep _1.fq.gz fastqList.txt > forwardReads.txt
# sed 's/_1.fq.gz//' forwardReads.txt > expGroupsOnly.txt

FQLIST=../testingData/fastqList.txt

# Text processing first
EXPGROUPS=$( < grep _1.fq.gz $FQLIST | sed 's/_1.fq.gz//' )
echo $EXPGROUPS

NUM=< wc -l $EXPGROUPS
echo "Table $META has $NUM rows including the hearder."

echo "First row:"
head -n 2 $META
for i in $(seq 1 $NUM)
do
    echo "$i of $NUM"
    
    export SRR
    qsub -v SRR -q copperhead runFastqParserSampler.pbs
    echo "Done with $SRR."
done