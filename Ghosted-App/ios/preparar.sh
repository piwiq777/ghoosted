#!/bin/sh
# Copia el diseño, el puente y los dos archivos de la extension a Recursos/,
# igual que hace Gradle en Android.
set -e
cd "$(dirname "$0")"
rm -rf Recursos && mkdir -p Recursos/web Recursos/ig
cp -R ../web/. Recursos/web/
cp ../ig/puente-ig.js Recursos/ig/
cp ../../Ghosted-Pro/src/page-api.js ../../Ghosted-Pro/src/ig-api.js Recursos/ig/
echo "Listo: Recursos/ preparado"
