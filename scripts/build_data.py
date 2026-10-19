"""Merge data/raw/*.json into data/graph.json, validating the verification rules.

Usage: python3 scripts/build_data.py
Facts or edges without a valid source are dropped and reported.
"""
import json, glob, os, sys, datetime
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATUSES = {"confirmed", "self", "disputed"}
GROUPS = {"core", "people", "products", "partners", "history", "regulatory"}
BANNED_HOSTS = ("reddit.com", "x.com", "twitter.com", "facebook.com", "t.me", "bitcointalk.org")

def good_sources(srcs, status="confirmed"):
    out = []
    for s in srcs or []:
        u = (s or {}).get("url", "")
        p = urlparse(u)
        if p.scheme not in ("http", "https") or not p.netloc:
            continue
        host = p.netloc.lower().split(":")[0]
        if p.path in ("", "/") and not p.query and status != "self":
            continue  # a bare home page only supports what the entity says about itself
        if any(host == b or host.endswith("." + b) for b in BANNED_HOSTS) or "coinmarketcap.com/community" in u:
            continue
        out.append({"title": s.get("title") or p.netloc, "url": u})
    return out

nodes, edges, problems = {}, {}, []
for f in sorted(glob.glob(os.path.join(ROOT, "data", "raw", "*.json"))):
    d = json.load(open(f, encoding="utf-8"))
    src = os.path.basename(f)
    for n in d.get("nodes", []):
        nid = n["id"]
        facts = []
        for fa in n.get("facts", []):
            s = good_sources(fa.get("sources"), fa.get("status"))
            if fa.get("status") not in STATUSES or not s or not fa.get("es") or not fa.get("en"):
                problems.append(f"{src}: dropped fact on {nid}: {fa.get('es','')[:70]}")
                continue
            fa["sources"] = s
            facts.append(fa)
        if nid in nodes:
            cur = nodes[nid]
            seen = {x["es"] for x in cur["facts"]}
            cur["facts"] += [x for x in facts if x["es"] not in seen]
            for k in ("summary_es", "summary_en", "website", "type", "group"):
                if not cur.get(k) and n.get(k):
                    cur[k] = n[k]
        else:
            n["facts"] = facts
            nodes[nid] = n
    for e in d.get("edges", []):
        s = good_sources(e.get("sources"), e.get("status"))
        if e.get("status") not in STATUSES or not s:
            problems.append(f"{src}: dropped edge {e.get('from')}->{e.get('to')}")
            continue
        e["sources"] = s
        key = (e["from"], e["to"], e.get("label_es", "").lower())
        rev = (e["to"], e["from"], e.get("label_es", "").lower())
        if key in edges or rev in edges:
            k = key if key in edges else rev
            urls = {x["url"] for x in edges[k]["sources"]}
            edges[k]["sources"] += [x for x in s if x["url"] not in urls]
        else:
            edges[key] = e

for nid, n in list(nodes.items()):
    if n.get("group") not in GROUPS:
        problems.append(f"bad group on {nid}: {n.get('group')}")
    if not n["facts"] and not n.get("summary_es"):
        problems.append(f"empty node removed: {nid}")
        del nodes[nid]

import re
cur_path = os.path.join(ROOT, "data", "curation.json")
drop = set(json.load(open(cur_path, encoding="utf-8")).get("drop_edges", [])) if os.path.exists(cur_path) else set()
used = set()
final_edges = []
for e in edges.values():
    k = f"{e['from']}|{e['to']}|{e.get('label_es','')}"
    if k in drop:
        used.add(k); continue
    e["_orig_label"] = e.get("label_es", "")
    # the status mark already says who claims it; keep labels short
    e["label_es"] = re.sub(r"\s*\((según|segun) [^)]*\)", "", e.get("label_es", "")).strip(" ;,")
    e["label_en"] = re.sub(r"\s*\((per|according to) [^)]*\)", "", e.get("label_en", "")).strip(" ;,")
    if e["from"] in nodes and e["to"] in nodes and e["from"] != e["to"]:
        final_edges.append(e)
    else:
        problems.append(f"edge with unknown node: {e['from']} -> {e['to']}")

# audited corrections (data/corrections.json)
corr_path = os.path.join(ROOT, "data", "corrections.json")
corrs = json.load(open(corr_path, encoding="utf-8")).get("corrections", []) if os.path.exists(corr_path) else []
for c in corrs:
    if c.get("action") == "note":
        continue
    ref = c["ref"]; hit = False
    if ref.startswith("fact:"):
        nid = ref.split(":")[1]
        n = nodes.get(nid)
        for f in list(n["facts"]) if n else []:
            if f["es"] == c.get("match_es"):
                hit = True
                if c["action"] == "remove":
                    n["facts"].remove(f); continue
                for k in ("es", "en", "status", "date"):
                    if c.get(k): f[k] = c[k]
    else:
        frm, to, lab = ref[5:].split("|", 2)
        for e in list(final_edges):
            if e["from"] == frm and e["to"] == to and (e.get("label_es") == lab or e.get("_orig_label") == lab):
                hit = True
                if c["action"] == "remove":
                    final_edges.remove(e); continue
                for k in ("label_es", "label_en", "status", "date"):
                    if c.get(k): e[k] = c[k]
    if not hit:
        problems.append(f"correction not applied: {ref[:90]}")
for k in drop - used:
    problems.append(f"curation key not found: {k}")
for e in final_edges:
    e.pop("_orig_label", None)
out = {"updated": datetime.date.today().isoformat(), "nodes": list(nodes.values()), "edges": final_edges}
json.dump(out, open(os.path.join(ROOT, "data", "graph.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
nf = sum(len(n["facts"]) for n in nodes.values())
print(f"nodes={len(nodes)} edges={len(final_edges)} facts={nf}")
print("\n".join(problems) if problems else "no problems")
