import re
import urllib.request

html = urllib.request.urlopen(
    "https://tourapplication-admin.onrender.com", timeout=40
).read().decode("utf-8", "replace")
print("admin html ok", len(html))
m = re.search(r"assets/([^\s\"']+\.js)", html)
print("js", m.group(1) if m else None)
if not m:
    raise SystemExit(1)
js = urllib.request.urlopen(
    f"https://tourapplication-admin.onrender.com/assets/{m.group(1)}", timeout=40
).read().decode("utf-8", "replace")
print("js len", len(js))
print("has prod api", "tourapplication-api.onrender.com" in js)
print("has /api/admin", "/api/admin" in js)
urls = sorted(set(re.findall(r"https://[a-zA-Z0-9._/-]+", js)))
for u in urls[:20]:
    print("url", u)
