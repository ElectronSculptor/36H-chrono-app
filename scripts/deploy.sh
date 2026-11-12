#!/usr/bin/env bash
# Publie le site sur GitHub Pages (branche gh-pages du dépôt).
# Usage : npm run deploy
set -euo pipefail
DEPOT="https://github.com/ElectronSculptor/36H-chrono-app.git"

npm run build
cd dist
touch .nojekyll                     # GitHub Pages : servir les fichiers tels quels
rm -rf .git
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C .. config user.name)" -c user.email="$(git -C .. config user.email)" \
  commit -qm "Déploiement du $(date '+%d/%m %H:%M')"
git push -qf "$DEPOT" gh-pages
rm -rf .git
echo "Publié : https://electronsculptor.github.io/36H-chrono-app/ (1 à 2 min de délai)"
