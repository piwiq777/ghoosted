#!/usr/bin/env bash
# Ghoosted — comprueba que este ordenador esta listo para trabajar.
# Uso:  bash preparar.sh
set -u
cd "$(dirname "$0")"
ok=0; mal=0
si() { echo "  OK   $1"; ok=$((ok+1)); }
no() { echo "  FALTA $1"; mal=$((mal+1)); }

echo "== Programas =="
command -v git  >/dev/null && si "git" || no "git"
command -v node >/dev/null && si "node $(node -v 2>/dev/null)" || no "node (hace falta para los tests)"
command -v python3 >/dev/null && si "python3" || no "python3 (hace falta para publicar)"

echo
echo "== Repositorio =="
r=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
[ "$r" = "marca-v1" ] && si "rama marca-v1" || no "estas en '$r' — usa: git checkout marca-v1"
git fetch -q origin 2>/dev/null
det=$(git rev-list --count HEAD..origin/"$r" 2>/dev/null || echo 0)
ade=$(git rev-list --count origin/"$r".."$r" 2>/dev/null || echo 0)
[ "$det" = "0" ] && si "al dia con GitHub" || no "$det commits por bajar — usa: git pull"
[ "$ade" = "0" ] || echo "  AVISO $ade commits sin subir — usa: git push"

echo
echo "== Secretos (NO estan en el repositorio, se copian a mano) =="
[ -f Ghosted-Landing/.env.local ] && si "Ghosted-Landing/.env.local" || no "Ghosted-Landing/.env.local (claves de Stripe)"
[ -d Ghosted-Landing/.vercel ]    && si "Ghosted-Landing/.vercel"    || no "Ghosted-Landing/.vercel (enlace con Vercel)"
[ -f "$HOME/.android/debug.keystore" ] && si "~/.android/debug.keystore" \
  || no "~/.android/debug.keystore — SIN ESTO el APK que compiles aqui NO se podra instalar encima del que ya esta puesto"

echo
echo "== Para compilar el APK (solo si vas a tocar la app) =="
[ -d "$HOME/Android/Sdk" ] && si "Android SDK" || no "Android SDK (no hace falta para la web ni los tests)"
[ -d "$HOME/.local/opt/jdk21" ] && si "JDK 21" || no "JDK 21 (no hace falta para la web ni los tests)"

echo
echo "== Tests =="
if command -v node >/dev/null; then
  (cd Ghosted-Pro && node test/run.js 2>&1 | tail -1)
else
  echo "  (sin node, no se pueden pasar)"
fi

echo
echo "-----------------------------------------"
[ "$mal" = "0" ] && echo "Todo listo." || echo "$mal cosas por resolver (mira los FALTA de arriba)."
