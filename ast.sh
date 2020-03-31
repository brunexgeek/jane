#!/bin/bash -x

BASEDIR=$(cd $(dirname $0) && pwd)

if [ -z "$1" ]; then
    SOURCE="$BASEDIR/test/function.bgl"
else
    SOURCE=$1
fi

SVGFILE="./ast.svg"
if [ -f "$SVGFILE" ]; then
    mv "$SVGFILE" "$SVGFILE.bak"
fi
$BASEDIR/build.sh && node beagle.js ast $SOURCE | dot -T svg -o$SVGFILE