#!/bin/bash

DIR=$(cd $(dirname "$0") && pwd)
for FILENAME in $(find $DIR -iname '*.jane')
do
    COMMAND="node $DIR/../build/jane.js generate -i $FILENAME -o /tmp/gen"
    echo $COMMAND && $COMMAND || exit 1
done