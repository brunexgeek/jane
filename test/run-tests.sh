#!/bin/bash -x

DIR=$(cd $(dirname "$0") && pwd)
for FILENAME in $(find $DIR -iname '*.jane')
do
    node "$DIR/../build/jane.js" generate $FILENAME > /dev/null || exit 1
done