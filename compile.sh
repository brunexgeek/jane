#!/bin/bash -x

BASEDIR=$(cd $(dirname $0) && pwd)
$BASEDIR/build.sh && node "$BASEDIR/compiler/beagle.js" generate "$1" > output.c