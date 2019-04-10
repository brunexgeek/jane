#!/bin/bash -x

BASEDIR=$(cd $(dirname $0); pwd)
tsc "$BASEDIR/compiler/beagle.ts" --sourceMap --removeComments --outFile "$BASEDIR/beagle.js"