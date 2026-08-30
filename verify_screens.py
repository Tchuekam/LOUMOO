import re

with open('Commerce App.dc.html', 'r', encoding='utf-8') as f:
    content = f.read()

screens = re.findall(r'<sc-if value="{{\s*is\.(\w+)\s*}}"', content)
print(f"Total screen conditionals found: {len(screens)}")
print("Screens found:", screens)

defined_screens = [
    'home','search','filters','voice','category','bestpicks','freeday',
    'notifications','chat','threadAi','threadSeller','product','sellers',
    'cart','checkout','paying','success','orders','store','business',
    'vs','vsCompare','visual','visualScan','visualResults','upload',
    'uploadDetails','uploadPrice','uploadSuccess','myListings','travel',
    'travelBus','travelPackages','travelVisa','travelResults','travelDetail',
    'travelPassenger','travelTicket','announce','announceDetail','profile',
    'seller','settings','payFailed','networkError','saved','transactions','loading'
]

missing = [s for s in defined_screens if s not in screens]
print("Missing screens count:", len(missing))
if missing:
    print("Missing screens:", missing)

open_sc = content.count('<sc-if')
close_sc = content.count('</sc-if>')
print(f"Open sc-if: {open_sc}, Close sc-if: {close_sc}")

print("Has </x-dc>:", '</x-dc>' in content)
print("Has <script type=\"text/x-dc\":", '<script type="text/x-dc"' in content)
print("Has </script>:", '</script>' in content)
print("Has </html>:", '</html>' in content)
