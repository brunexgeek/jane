#!/bin/bash -x

BASEDIR=$(cd $(dirname $0) && pwd)
OUTFILE="./jane-ast.html"

if [ -f "$OUTFILE" ]; then
    mv "$OUTFILE" "$OUTFILE.bak"
fi

if [ -z "$1" ]; then
    exit 1
fi

$BASEDIR/build.sh && node "$BASEDIR/build/jane.js" ast -i "$1" -o $OUTFILE
