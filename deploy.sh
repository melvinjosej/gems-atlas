#!/bin/bash
# 💎 Gems Atlas App Deployment Script (x20web + GitHub Pages)
# Exit immediately if any command fails
set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "=================================================="
echo "💎 1. COMPILING THE REACT IPAD GEMS ATLAS WEB APP..."
echo "=================================================="
npm run build

echo ""
echo "=================================================="
echo "⚙️ 2. INLINING CSS & JS BUNDLE FOR X20WEB SSO/CORS..."
echo "=================================================="
python3 - << 'EOF'
import glob
import re

css_files = sorted(glob.glob('dist/assets/*.css'))
js_files = sorted(glob.glob('dist/assets/*.js'))

css_content = ''
for cf in css_files:
    with open(cf, 'r', encoding='utf-8') as f:
        css_content += f.read() + '\n'

js_content = ''
for jf in js_files:
    with open(jf, 'r', encoding='utf-8') as f:
        raw_js = f.read()
        # Rewrite Vite's import.meta.url asset resolution so inlined script resolves ./assets/<file>
        fixed_js = re.sub(
            r'new URL\(`([^`]+)`,import\.meta\.url\)\.href',
            r'`./assets/\1`',
            raw_js
        )
        js_content += fixed_js + '\n'

assert '</script' not in js_content.lower(), 'Unexpected </script in JS bundle'
assert '</style' not in css_content.lower(), 'Unexpected </style in CSS bundle'

inlined_html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="description" content="Interactive World Atlas of Gems, Crystals, NatGeo Gem Dig Kit Treasures, and Rock Tumbler Lab for Kids!" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Gems Atlas" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700;900&display=swap" rel="stylesheet" />
    <title>My Atlas of Gems &amp; Crystals! 💎🌍</title>
    <style>
{css_content}
    </style>
  </head>
  <body class="bg-[#fdf4ff]">
    <div id="root"></div>
    <script type="module">
{js_content}
    </script>
  </body>
</html>
"""

with open('dist/index.html', 'w', encoding='utf-8') as f:
    f.write(inlined_html)

print(f"✅ Inlined CSS ({len(css_content)} bytes) + JS ({len(js_content)} bytes) into dist/index.html ({len(inlined_html)} bytes total)")
EOF

echo ""
echo "=================================================="
echo "📂 3. PUBLISHING STATIC CONTENT TO GOOGLE x20..."
echo "=================================================="
X20_DIR="/google/data/rw/users/me/melvinp/www/gems-atlas"

echo "Recreating target x20 folder via POSIX FUSE mount: $X20_DIR"
rm -rf "$X20_DIR"
mkdir -p "$X20_DIR/assets"
chmod 0755 "$X20_DIR" "$X20_DIR/assets"

echo "Copying fresh optimized bundle to x20..."
cp -f dist/index.html "$X20_DIR/index.html"
cp -f dist/favicon.svg "$X20_DIR/favicon.svg"
cp -f dist/manifest.json "$X20_DIR/manifest.json"
cp -f dist/assets/* "$X20_DIR/assets/"

chmod 0644 "$X20_DIR/index.html" "$X20_DIR/favicon.svg" "$X20_DIR/manifest.json" "$X20_DIR/assets/"*

echo ""
echo "=================================================="
echo "🐙 4. PUBLISHING TO GITHUB PAGES (gh-pages)..."
echo "=================================================="
ORIGIN_URL=$(git remote get-url origin 2>/dev/null || true)
if [ -n "$ORIGIN_URL" ]; then
  TMP_GH=$(mktemp -d)
  cp -r dist/* "$TMP_GH/"
  touch "$TMP_GH/.nojekyll"
  git -C "$TMP_GH" init -b gh-pages
  git -C "$TMP_GH" config user.name "Melvin Johnson"
  git -C "$TMP_GH" config user.email "melvinp@google.com"
  git -C "$TMP_GH" add .
  git -C "$TMP_GH" commit -m "Deploy Gems Atlas to GitHub Pages"
  git -C "$TMP_GH" push -f "$ORIGIN_URL" gh-pages
  rm -rf "$TMP_GH"
fi

echo ""
echo "=================================================="
echo "🎉 DEPLOYMENT COMPLETE PERFECTLY!"
echo "=================================================="
echo "Your interactive iPad Gems Atlas & Rock Tumbler app is now live!"
echo "👉 GitHub Pages (Full Microphone & Storage Support):"
echo "https://melvinjosej.github.io/gems-atlas/"
echo "👉 Google x20web:"
echo "https://melvinp.users.x20web.corp.google.com/www/gems-atlas/index.html"
echo "=================================================="
