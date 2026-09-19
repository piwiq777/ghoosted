#!/usr/bin/env python3
"""Publica una version nueva de la app movil en Ghosted-Landing/movil/.

    python3 tools/publicar.py          # solo web: la app se actualiza sola
    python3 tools/publicar.py --apk    # ademas APK nuevo (sube versionCode)

Deja en movil/ los archivos de web/ e ig/, los dos de la extension que hablan
con Instagram, el APK y manifest.json con el sha256 de cada uno. La app baja
manifest.json, compara versiones y verifica cada archivo antes de usarlo.
Luego hay que desplegar la web (push a main) para que llegue a los moviles."""
import hashlib, json, os, re, shutil, subprocess, sys

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAIZ = os.path.dirname(APP)
DEST = os.path.join(RAIZ, 'Ghosted-Landing', 'movil')
GRADLE = os.path.join(APP, 'android', 'app', 'build.gradle')

def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()

anterior = {}
try: anterior = json.load(open(os.path.join(DEST, 'manifest.json')))
except Exception: pass
version = max(anterior.get('web', {}).get('version', 0), json.load(open(os.path.join(APP, 'web', 'version.json')))['version']) + 1
json.dump({'version': version}, open(os.path.join(APP, 'web', 'version.json'), 'w'))

g = open(GRADLE).read()
vc = int(re.search(r'versionCode (\d+)', g).group(1))
if '--apk' in sys.argv:
    vc += 1
    g = re.sub(r'versionCode \d+', 'versionCode %d' % vc, g)
    g = re.sub(r'versionName "[^"]*"', 'versionName "1.%d.0"' % vc, g)
    open(GRADLE, 'w').write(g)

env = dict(os.environ, JAVA_HOME=os.path.expanduser('~/.local/opt/jdk21'), ANDROID_HOME=os.path.expanduser('~/Android/Sdk'))
subprocess.run(['./gradlew', 'assembleRelease', '--no-daemon', '-q'], cwd=os.path.join(APP, 'android'), env=env, check=True)

shutil.rmtree(DEST, ignore_errors=True)
os.makedirs(DEST)
archivos = {}
fuentes = [('web', os.path.join(APP, 'web')), ('ig', os.path.join(APP, 'ig'))]
for pref, carpeta in fuentes:
    for base, _, nombres in os.walk(carpeta):
        for n in nombres:
            src = os.path.join(base, n)
            rel = pref + '/' + os.path.relpath(src, carpeta).replace(os.sep, '/')
            dst = os.path.join(DEST, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            archivos[rel] = sha(dst)
for n in ('page-api.js', 'ig-api.js'):
    dst = os.path.join(DEST, 'ig', n)
    shutil.copy2(os.path.join(RAIZ, 'Ghosted-Pro', 'src', n), dst)
    archivos['ig/' + n] = sha(dst)
apk = os.path.join(DEST, 'Ghoosted.apk')
shutil.copy2(os.path.join(APP, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'), apk)
shutil.copy2(apk, os.path.join(APP, 'dist', 'Ghoosted.apk'))
json.dump({
    'web': {'version': version, 'archivos': archivos},
    'apk': {'versionCode': vc, 'url': 'https://www.ghoosted.net/movil/Ghoosted.apk', 'sha256': sha(apk)}
}, open(os.path.join(DEST, 'manifest.json'), 'w'), indent=1)
print('publicado: web v%d, apk %d, %d archivos en %s' % (version, vc, len(archivos), DEST))
