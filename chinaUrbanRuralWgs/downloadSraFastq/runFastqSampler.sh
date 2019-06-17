#!/bin/bash

META=../meta_soil_blj.txt
COL=10
NUM=$( < $META wc -l)
echo "Table $META has $NUM rows including the header."
echo "Taking SRA accession id's from column: $COL."

echo "First row:"
head -n 2 $META


for i in $(seq 2 $NUM)
do
    echo "$i of $NUM"
    SRR=$(sed -ne "${i}p" ${META} | cut -f ${COL})
    export SRR
    qsub -v SRR -q copperhead runFastqParserSampler.pbs
    echo "launched $SRR."
done

echo Remember to re-zip your files