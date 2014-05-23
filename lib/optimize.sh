#! /bin/bash

MOZJPEG_PATH=~/mozjpeg/

FORMAT=$1
FILE=$2

case $FORMAT in
  JPG)
    # There is no binary to convert from jpeg to jpeg with loss (jpegtran is
    # lossless), so (for now) we have to djpeg and convert back to jpeg...
    $MOZJPEG_PATH/djpeg -outfile $FILE.bmp $FILE
    $MOZJPEG_PATH/cjpeg  -quality 90 -outfile $FILE $FILE.bmp
    rm $FILE.bmp
    ;;
  PNG)
    pngquant --skip-if-larger -o $FILE.png $FILE
    if [ $? -eq 0 ]; then
      mv $FILE.png $FILE
    fi
    ;;
  *)
    echo "Format not recognized."
    ;;
esac
