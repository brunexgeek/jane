#!/bin/bash -x

BASEDIR=$(cd $(dirname $0) && pwd)
SVGFILE="./ast.svg"

if [ -f "$SVGFILE" ]; then
    mv "$SVGFILE" "$SVGFILE.bak"
fi

$BASEDIR/build.sh && node "$BASEDIR/compiler/beagle.js" ast "$1" | dot -T svg -o$SVGFILE