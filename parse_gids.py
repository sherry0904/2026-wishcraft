import urllib.request
import re

url = "https://docs.google.com/spreadsheets/d/1prvIOMXTWExptg7uoZuUt2mYI7HaS0siypZAn7vprl4/edit?usp=sharing"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')

import json
# let's look for ["Quests",...] or similar
pattern = r'\[\d+,"[^"]*",.*?\d+\]'
for match in re.findall(r'\[[a-zA-Z0-9_,]+,"Quests".*?\]', html):
    print("MATCH 1:", match)
for match in re.findall(r'"Quests",(\d+)', html):
    print("MATCH 2:", match)
for match in re.findall(r'(\d+),"Quests"', html):
    print("MATCH 3:", match)
for match in re.findall(r'\["[a-zA-Z0-9]+","Quests"\]', html):
    print("MATCH 4:", match)

# the actual structure in Google sheets for tab names is usually something like:
# [123456789,"Quests",2,1,0,0, ... ]
# Let's try finding the big list of tabs
for match in re.finditer(r'\[(\d+),"([^"]+)",2', html):
    print(f"Found sheet: {match.group(2)} -> gid={match.group(1)}")
