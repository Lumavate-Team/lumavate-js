#!/bin/bash
cp components.json dist/
cp -r src/assets dist/assets/
cd dist
zip -r Archive.zip .
