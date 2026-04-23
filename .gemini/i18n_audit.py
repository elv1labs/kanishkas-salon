#!/usr/bin/env python3
"""Audit a page for hardcoded English strings when Hindi locale is set."""
import sys, re

content = sys.stdin.read()

# Extract text between HTML tags (skip style/script/meta)
# Match text content > 3 chars that starts with uppercase letter
pattern = r'>([A-Z][a-zA-Z\s&\'",.\-!?:;()+0-9]+)<'
matches = re.findall(pattern, content)

seen = set()
results = []
for m in matches:
    m = m.strip()
    # Skip short, numeric, or brand names
    if len(m) < 4:
        continue
    if m in seen:
        continue
    # Skip things that are likely proper nouns / data (names, addresses)
    if m in ('Kanishka Sen', 'Priya Sharma', 'Priya Verma', 'Anita Sharma', 'Neha Gupta', 'Aarti Joshi',
             'Kanishkas Family Salon', 'Indore', 'Madhya Pradesh', 'WhatsApp',
             'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'):
        continue
    seen.add(m)
    results.append(m)

for r in results[:50]:
    print(f"  HARDCODED: {r[:90]}")

if not results:
    print("  ALL TRANSLATED (no hardcoded English found)")
