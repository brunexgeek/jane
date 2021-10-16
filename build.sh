#!/bin/bash

BASEDIR=$(cd $(dirname $0) && pwd)
npx tsc -p $BASEDIR
