#!/bin/bash

module load sra-tools  
mkdir logs; download.sh &> logs/download.log

meta=../metadata/PRJNA349463.tsv
col=6

num=$( < $meta wc -l)
echo "Table $meta has $num rows including the hearder."
echo "Taking SRA accession id's from column: $col."

echo "First row:"
head -n 2 $meta

for i in $(seq 2 $num)
do
    echo "$i of $num"
    srr=$(sed -ne "${i}p" ${meta} | cut -f ${col})
    srr="$(echo -e "${srr}" | tr -d '[:space:]')"
    echo "Getting ${srr}..."
    if [ "$srr" != "NA" ];
    then
        fasterq-dump $srr
        echo " ... gzip ... "
        gzip ${srr}*
        echo "Done with $srr."
    fi
done
