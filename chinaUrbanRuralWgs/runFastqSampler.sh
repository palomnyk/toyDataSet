#!/bin/bash

meta=./metadata/PRJNA349463.tsv
col=6
num=$( < $meta wc -l)
echo "Table $meta has $num rows including the header."
echo "Taking SRA accession id's from column: $col."

echo "First row:"
head -n 2 $meta


for i in $(seq 2 $num)
do
    echo "$i of $num"
    echo "$SRR"
    if [ "${SRR}" != "NA" ] 
    then
        echo "in if then"
        SRR=$(sed -ne "${i}p" ${meta} | cut -f ${col})
        export SRR
        qsub -v SRR -q copperhead runFastqSampler.pbs
        echo "launched $SRR."
    fi
done

echo Remember to re-zip your files