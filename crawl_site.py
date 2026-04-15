#!/usr/bin/env python3
"""
Static site crawler - mirrors riptus.net locally (fixed version)
- Query hash inserted BEFORE extension: styles_abc123.css not styles.css_abc123
- Content-Type used to determine extension for extensionless URLs (e.g. Google Fonts)
- CSS url() rewritten to relative paths (not root-relative) so deployed sites work
"""
import os
import re
import sys
import time
import hashlib
import urllib.parse
from pathlib import Path
from collections import deque

import requests
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "https://riptus.net"
OUTPUT_DIR = Path("c:/Users/Administrator/Downloads/Writerity/riptus.net")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"
}
SESSION = requests.Session()
SESSION.headers.update(HEADERS)

visited_pages = set()
downloaded_assets = set()
url_path_cache: dict[str, Path] = {}  # URL -> actual saved local path

CONTENT_TYPE_EXT = {
    "text/css": ".css",
    "application/javascript": ".js",
    "text/javascript": ".js",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "font/woff": ".woff",
    "font/woff2": ".woff2",
    "font/ttf": ".ttf",
    "application/font-woff": ".woff",
    "application/font-woff2": ".woff2",
}


# ── Slug / path helpers ───────────────────────────────────────────────────────

def make_slug(raw: str, max_len: int = 40) -> str:
    decoded = urllib.parse.unquote(raw, encoding="utf-8", errors="replace")
    ascii_only = re.sub(r'[^\x00-\x7F]+', '', decoded)
    slug = re.sub(r'[^a-zA-Z0-9._-]+', '-', ascii_only).strip('-').lower()
    slug = re.sub(r'-{2,}', '-', slug)
    return slug[:max_len] if slug else ""


def safe_asset_path(url: str, content_type: str = "") -> Path:
    """
    Convert URL to a safe local path.
    Hash from query string is inserted BEFORE the file extension.
    """
    parsed = urllib.parse.urlparse(url)
    raw_path = parsed.path.strip("/")
    qhash = hashlib.md5(parsed.query.encode()).hexdigest()[:8] if parsed.query else ""

    if not raw_path:
        raw_path = "index"

    parts = raw_path.split("/")
    safe_parts = []
    for i, part in enumerate(parts):
        is_last = (i == len(parts) - 1)
        if is_last:
            # Split stem and extension properly
            name, ext = os.path.splitext(part)
            ext = ext.lower()

            safe_name = make_slug(name, max_len=35)
            if not safe_name:
                safe_name = f"file-{hashlib.md5(part.encode()).hexdigest()[:8]}"

            # Insert hash before extension
            if qhash:
                safe_name = f"{safe_name}_{qhash}"

            # Determine extension: prefer URL extension, fall back to Content-Type
            if not ext and content_type:
                ct_base = content_type.split(";")[0].strip().lower()
                ext = CONTENT_TYPE_EXT.get(ct_base, "")

            if not ext:
                ext = ".bin"

            safe_parts.append(safe_name + ext)
        else:
            s = make_slug(part, max_len=40)
            if not s:
                s = f"seg-{hashlib.md5(part.encode()).hexdigest()[:8]}"
            safe_parts.append(s)

    # Domain prefix for external hosts
    is_external = parsed.netloc and parsed.netloc not in ("riptus.net", "www.riptus.net", "")
    if is_external:
        domain_slug = make_slug(parsed.netloc.replace("www.", "").split(".")[0], max_len=15)
        rel = Path(domain_slug).joinpath(*safe_parts) if safe_parts else Path(domain_slug)
    else:
        rel = Path(*safe_parts) if safe_parts else Path("file.bin")

    return OUTPUT_DIR / rel


def safe_page_path(url: str) -> Path:
    parsed = urllib.parse.urlparse(url)
    raw_path = parsed.path.strip("/")
    if parsed.query:
        qhash = hashlib.md5(parsed.query.encode()).hexdigest()[:8]
        raw_path = (raw_path.rstrip("/") + "-" + qhash) if raw_path else qhash
    if not raw_path:
        return OUTPUT_DIR / "index.html"
    parts = raw_path.split("/")
    safe_parts = [make_slug(p, 40) or f"seg-{hashlib.md5(p.encode()).hexdigest()[:8]}" for p in parts]
    return OUTPUT_DIR / Path(*safe_parts) / "index.html"


# ── Network helpers ───────────────────────────────────────────────────────────

def is_same_domain(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    return parsed.netloc in ("", "riptus.net", "www.riptus.net")


def normalize_url(url: str, base: str) -> str:
    url = url.strip()
    if url.startswith("//"):
        url = "https:" + url
    url = urllib.parse.urljoin(base, url)
    return urllib.parse.urldefrag(url)[0]


def rel_path(local: Path, page_local: Path) -> str:
    """Always return a relative path — never root-relative — so deployed sites work."""
    try:
        return str(local.relative_to(page_local.parent)).replace("\\", "/")
    except ValueError:
        # Fall back to root-relative only if can't make relative
        try:
            return "/" + str(local.relative_to(OUTPUT_DIR)).replace("\\", "/")
        except ValueError:
            return str(local).replace("\\", "/")


# ── Asset download ────────────────────────────────────────────────────────────

def download_asset(url: str) -> Path | None:
    if url in downloaded_assets:
        return url_path_cache.get(url)
    try:
        resp = SESSION.get(url, timeout=20, stream=True)
        if resp.status_code != 200:
            return None
        ct = resp.headers.get("Content-Type", "")
        local = safe_asset_path(url, ct)
        local.parent.mkdir(parents=True, exist_ok=True)
        with open(local, "wb") as f:
            for chunk in resp.iter_content(65536):
                f.write(chunk)
        downloaded_assets.add(url)
        url_path_cache[url] = local
        print(f"  [asset] {url}")
        return local
    except Exception as e:
        print(f"  [WARN]  {url}: {e}")
        return None


def rewrite_css_urls(css_text: str, css_url: str, css_local: Path) -> str:
    """Rewrite url() in CSS to be relative to the CSS file's location."""
    def replacer(m):
        raw = m.group(1).strip("'\"")
        if raw.startswith("data:") or raw.startswith("#"):
            return m.group(0)
        abs_url = normalize_url(raw, css_url)
        local = download_asset(abs_url)
        if local:
            try:
                # Relative from CSS file location
                r = str(local.relative_to(css_local.parent)).replace("\\", "/")
                return f"url('{r}')"
            except ValueError:
                try:
                    r = str(local.relative_to(OUTPUT_DIR)).replace("\\", "/")
                    return f"url('/{r}')"
                except ValueError:
                    pass
        return m.group(0)
    return re.sub(r'url\(([^)]+)\)', replacer, css_text)


def process_css(url: str) -> Path | None:
    if url in downloaded_assets:
        return url_path_cache.get(url)
    try:
        resp = SESSION.get(url, timeout=20)
        if resp.status_code != 200:
            return None
        ct = resp.headers.get("Content-Type", "text/css")
        local = safe_asset_path(url, ct)
        local.parent.mkdir(parents=True, exist_ok=True)
        css = rewrite_css_urls(resp.text, url, local)
        local.write_text(css, encoding="utf-8")
        downloaded_assets.add(url)
        url_path_cache[url] = local
        print(f"  [css]   {url}")
        return local
    except Exception as e:
        print(f"  [WARN]  CSS {url}: {e}")
        return None


# ── Page crawl ────────────────────────────────────────────────────────────────

def crawl_page(url: str) -> list[str]:
    if url in visited_pages:
        return []
    visited_pages.add(url)

    try:
        resp = SESSION.get(url, timeout=30)
        if resp.status_code != 200:
            print(f"[SKIP]  {url} -> {resp.status_code}")
            return []
    except Exception as e:
        print(f"[ERROR] {url}: {e}")
        return []

    print(f"[page]  {url}")
    soup = BeautifulSoup(resp.text, "lxml")
    found = []
    page_local = safe_page_path(url)

    # Stylesheets
    for tag in soup.find_all("link", rel=lambda r: r and "stylesheet" in r):
        href = tag.get("href", "")
        if not href:
            continue
        abs_url = normalize_url(href, url)
        local = process_css(abs_url)
        if local:
            tag["href"] = rel_path(local, page_local)

    # Scripts
    for tag in soup.find_all("script", src=True):
        abs_url = normalize_url(tag["src"], url)
        local = download_asset(abs_url)
        if local:
            tag["src"] = rel_path(local, page_local)

    # Images
    for tag in soup.find_all("img"):
        for attr in ("src", "data-src", "data-lazy-src"):
            val = tag.get(attr, "")
            if val and not val.startswith("data:"):
                local = download_asset(normalize_url(val, url))
                if local:
                    tag[attr] = rel_path(local, page_local)
        srcset = tag.get("srcset", "")
        if srcset:
            new_parts = []
            for part in srcset.split(","):
                part = part.strip()
                if not part:
                    continue
                pieces = part.split()
                local = download_asset(normalize_url(pieces[0], url))
                if local:
                    pieces[0] = rel_path(local, page_local)
                new_parts.append(" ".join(pieces))
            tag["srcset"] = ", ".join(new_parts)

    # <source>
    for tag in soup.find_all("source"):
        for attr in ("src", "srcset"):
            val = tag.get(attr, "")
            if val and not val.startswith("data:"):
                local = download_asset(normalize_url(val, url))
                if local:
                    tag[attr] = rel_path(local, page_local)

    # Slider / lazy data attrs
    for attr in ("data-bg", "data-thumb", "data-src", "data-lazy"):
        for tag in soup.find_all(attrs={attr: True}):
            val = tag[attr]
            if val and not val.startswith("data:") and not val.startswith("{"):
                local = download_asset(normalize_url(val, url))
                if local:
                    tag[attr] = rel_path(local, page_local)

    # Inline styles
    for tag in soup.find_all(style=True):
        def replacer(m, _url=url, _pl=page_local):
            raw = m.group(1).strip("'\"")
            if raw.startswith("data:") or raw.startswith("#"):
                return m.group(0)
            local = download_asset(normalize_url(raw, _url))
            if local:
                return f"url('{rel_path(local, _pl)}')"
            return m.group(0)
        tag["style"] = re.sub(r'url\(([^)]+)\)', replacer, tag["style"])

    # Links
    for tag in soup.find_all("a", href=True):
        href = tag["href"]
        if href.startswith("#") or href.startswith("/#") or href.startswith("#!/"):
            continue
        abs_url = normalize_url(href, url)
        if not is_same_domain(abs_url):
            continue
        ext = os.path.splitext(urllib.parse.urlparse(abs_url).path)[1].lower()
        if ext in (".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".pdf",
                   ".zip", ".mp4", ".mp3", ".woff", ".woff2", ".ttf", ".eot"):
            local = download_asset(abs_url)
            if local:
                tag["href"] = rel_path(local, page_local)
        else:
            if abs_url not in visited_pages:
                found.append(abs_url)
            tag["href"] = rel_path(safe_page_path(abs_url), page_local)

    # Save
    page_local.parent.mkdir(parents=True, exist_ok=True)
    page_local.write_text(str(soup), encoding="utf-8")
    time.sleep(0.3)
    return found


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    # Wipe and recreate output dir for a clean crawl
    import shutil
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Crawling {BASE_URL} -> {OUTPUT_DIR}\n")

    queue = deque([BASE_URL + "/"])
    seeds = ["/privacy-policy/", "/terms-and-condition/", "/blog/", "/all-blogs/"]
    for p in seeds:
        queue.append(BASE_URL + p)

    while queue:
        url = queue.popleft()
        if url in visited_pages:
            continue
        for p in crawl_page(url):
            if p not in visited_pages:
                queue.append(p)

    # Final check
    long = [
        name
        for root, dirs, files in os.walk(OUTPUT_DIR)
        for name in dirs + files
        if len(name) > 50
    ]

    print(f"\nDone! Pages: {len(visited_pages)}, Assets: {len(downloaded_assets)}")
    if long:
        print(f"WARNING: {len(long)} long names:")
        for l in long[:5]:
            print(f"  {l}")
    else:
        print("All filenames repo-safe (<=50 chars).")
    print(f"Open: {OUTPUT_DIR / 'index.html'}")


if __name__ == "__main__":
    main()
