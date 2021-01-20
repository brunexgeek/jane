#!/bin/bash -x

BASEDIR=$(cd $(dirname $0) && pwd)
SVGFILE="./ast.svg"

if [ -f "$SVGFILE" ]; then
    mv "$SVGFILE" "$SVGFILE.bak"
fi

if [ -z "$1" ]; then
    exit 1
fi

$BASEDIR/build.sh && node "$BASEDIR/compiler/beagle.js" ast "$1" | dot -T svg -o$SVGFILE