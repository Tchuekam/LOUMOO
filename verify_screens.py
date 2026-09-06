import glob
import re

# Read all DC files: root app and all route-level chunk files
files = ['Commerce App.dc.html'] + glob.glob('*Screens.dc.html')
all_content = ''
for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        all_content += '\n' + f.read()

# Find all screen identifiers in sc-if conditionals
screens = set(re.findall(r'\bis\.(\w+)\b', all_content))
print(f"Total unique screen conditionals found: {len(screens)}")

with open('Commerce App.dc.html', 'r', encoding='utf-8') as f:
    root_content = f.read()

screens_match = re.search(r'const SCREENS = \[([\s\S]*?)\];', root_content)
if screens_match:
    raw_screens = re.sub(r'//.*', '', screens_match.group(1))
    defined_screens = [s.strip(" '\"\n\r") for s in raw_screens.split(',') if s.strip(" '\"\n\r")]
else:
    defined_screens = []

print(f"Total screens declared in SCREENS: {len(defined_screens)}")

missing = [s for s in defined_screens if s not in screens]
print("Missing screens count:", len(missing))
if missing:
    print("Missing screens:", missing)
else:
    print("All defined screens have corresponding template conditionals across app shell and chunks!")

open_sc = all_content.count('<sc-if')
close_sc = all_content.count('</sc-if>')
print(f"Open sc-if: {open_sc}, Close sc-if: {close_sc}")

print("Has </x-dc>:", '</x-dc>' in root_content)
print("Has <script type=\"text/x-dc\":", '<script type="text/x-dc"' in root_content)
print("Has </script>:", '</script>' in root_content)
print("Has </html>:", '</html>' in root_content)
