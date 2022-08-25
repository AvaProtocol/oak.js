#!/usr/bin/env bash

otp=$1

if [ -z "$otp" ]; then
  echo "Provide otp code as argument"
  exit 1
fi

for package in $(ls packages); do
  sed 's/build\/index/index/' packages/$package/package.json \
    | tee packages/$package/build/package.json

  cd packages/$package/build
  npm publish --otp $otp
  cd -
done
