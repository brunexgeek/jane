#!/bin/bash -x

DIR=$(cd $(dirname "$0") && pwd)
find $DIR -iname '*.jane' | xargs -I {} node "$DIR/../build/jane.js" generate {} > /dev/null || exit 1