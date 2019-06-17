#!/bin/bash

#  mkdir logs; download.sh &> logs/download.log

module load sra-tools  

META=../meta_soil_blj.txt
COL=10

NUM=$( < $META wc -l)
echo "Table $META has $NUM rows including the hearder."
echo "Taking SRA accession id's from column: $COL."

echo "First row:"
head -n 2 $META

for i in $(seq 2 $NUM)
do
    echo "$i of $NUM"
    SRR=$(sed -ne "${i}p" ${META} | cut -f ${COL})
    SRR="$(echo -e "${SRR}" | tr -d '[:space:]')"
    echo "Getting ${SRR}..."
    fasterq-dump $SRR
    echo " ... gzip ... "
    gzip ${SRR}*
    echo "Done with $SRR."
done
