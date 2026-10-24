#!/usr/bin/env python3
"""Word counts for the expanded pages in api/content/ (existing text + added sections) and the
45-55 word answer-box / 40-55 word FAQ checks. Usage: python3 tools/content-stats.py"""
import json, os, re, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(root, 'api', 'defaults.json'), encoding='utf-8'))
w = lambda s: len(re.sub(r'<[^>]+>|\*\*|^#+\s|^>\s?|^[-*]\s|^\d+\.\s', ' ', s or '', flags=re.M).split())
slug = lambda t: re.sub(r'[^a-z0-9]+', '-', t.lower().replace('&', ' and ')).strip('-')
items = []
for s in d['services'] + d['_seedServices']:
    if not s.get('redirectTo'): items.append(('services', s.get('slug') or slug(s['title']), s['title'], w(s.get('desc'))))
for p in d['_seedPosts'] + d['blog']:
    if p.get('published') and not p.get('redirectTo'): items.append(('posts', p['slug'], p['title'], w(p.get('body'))))
bad = 0
for kind, key, title, base in items:
    f = os.path.join(root, 'api', 'content', kind, key + '.md')
    if not os.path.exists(f): print(f'  --   {base:5d}  {kind[:-1]:7} {key}'); continue
    md = open(f, encoding='utf-8').read()
    ans = re.search(r'^>\s*\*\*[^*]+\*\*\s*(.+)$', md, re.M)
    aw = len(ans.group(1).split()) if ans else 0
    faq = md.split('## Frequently Asked Questions')[1] if '## Frequently Asked Questions' in md else ''
    fw = [len(' '.join(x.strip().split('\n')[1:]).split()) for x in re.split(r'^### ', faq, flags=re.M)[1:]]
    total = base + w(md)
    flags = []
    if not 45 <= aw <= 55: flags.append(f'answer {aw}w')
    if any(not 40 <= x <= 55 for x in fw): flags.append(f'faq {fw}')
    bad += bool(flags)
    print(f'  ok   {total:5d}  {kind[:-1]:7} {key}  (answer {aw}w, faq {fw})' + ('  <-- ' + '; '.join(flags) if flags else ''))
sys.exit(1 if bad else 0)
