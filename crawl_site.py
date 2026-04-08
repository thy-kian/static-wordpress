#!/usr/bin/env python3
"""
Static site crawler - mirrors riptus.net locally
All directory/file names are sanitized at crawl time to be repo-safe (ASCII, ≤50 chars).
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

visited_pages = set()        # original URLs already crawled
downloaded_assets = set()    # original URLs already downloaded
url_to_slug: dict[str, str] = {}   # original URL -> safe local path (relative to OUTPUT_DIR)
slug_counter = [0]


# ── Slug helpers ──────────────────────────────────────────────────────────────

def make_safe_slug(raw: str, max_len: int = 45) -> str:
    """Turn any string into a short, filesystem-safe ASCII slug."""
    decoded = urllib.parse.unquote(raw, encoding="utf-8", errors="replace")
    ascii_only = re.sub(r'[^\x00-\x7F]+', '', decoded)
    slug = re.sub(r'[^a-zA-Z0-9._-]+', '-', ascii_only).strip('-').lower()
    slug = re.sub(r'-{2,}', '-', slug)
    return slug[:max_len] if slug else ""


def safe_asset_path(url: str) -> Path:
    """
    Convert any asset URL to a short, safe local path under OUTPUT_DIR.
    Preserves the directory structure but sanitizes each segment.
    """
    parsed = urllib.parse.urlparse(url)

    # Build path segments, sanitizing each one
    raw_path = parsed.path.strip("/")
    if parsed.query:
        qhash = hashlib.md5(parsed.query.encode()).hexdigest()[:8]
        raw_path = raw_path + "_" + qhash if raw_path else qhash

    if not raw_path:
        raw_path = "index"

    parts = raw_path.split("/")
    safe_parts = []
    for i, part in enumerate(parts):
        is_last = (i == len(parts) - 1)
        if is_last and "." in part:
            # Keep extension, sanitize stem
            name, ext = os.path.splitext(part)
            ext = ext.lower()
            safe_name = make_safe_slug(name, max_len=40)
            if not safe_name:
                safe_name = f"file-{hashlib.md5(part.encode()).hexdigest()[:8]}"
            safe_parts.append(safe_name + ext)
        else:
            s = make_safe_slug(part, max_len=40)
            if not s:
                s = f"seg-{hashlib.md5(part.encode()).hexdigest()[:8]}"
            safe_parts.append(s)

    # Netloc prefix to avoid collisions between different external domains
    netloc = parsed.netloc.replace("www.", "")
    domain_prefix = make_safe_slug(netloc.split(".")[0], max_len=15) if parsed.netloc and parsed.netloc not in (
        "riptus.net", "www.riptus.net"
    ) else ""

    if domain_prefix:
        rel = Path(domain_prefix).joinpath(*safe_parts)
    else:
        rel = Path(*safe_parts) if safe_parts else Path("file")

    # Make sure the final path has a file extension
    if not rel.suffix:
        rel = rel.with_suffix(".html")

    return OUTPUT_DIR / rel


def safe_page_path(url: str) -> Path:
    """Convert a page URL to a local index.html path with safe segments."""
    parsed = urllib.parse.urlparse(url)
    raw_path = parsed.path.strip("/")

    if not raw_path:
        return OUTPUT_DIR / "index.html"

    parts = raw_path.split("/")
    safe_parts = []
    for part in parts:
        s = make_safe_slug(part, max_len=40)
        if not s:
            s = f"seg-{hashlib.md5(part.encode()).hexdigest()[:8]}"
        safe_parts.append(s)

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
    """Return the safest relative path from page_local's dir to local."""
    try:
        return str(local.relative_to(page_local.parent)).replace("\\", "/")
    except ValueError:
        pass
    try:
        return "/" + str(local.relative_to(OUTPUT_DIR)).replace("\\", "/")
    except ValueError:
        return str(local).replace("\\", "/")


# ── Asset download ────────────────────────────────────────────────────────────

def download_asset(url: str) -> Path | None:
    if url in downloaded_assets:
        return safe_asset_path(url)
    try:
        resp = SESSION.get(url, timeout=20, stream=True)
        if resp.status_code != 200:
            return None
        local = safe_asset_path(url)
        local.parent.mkdir(parents=True, exist_ok=True)
        with open(local, "wb") as f:
            for chunk in resp.iter_content(65536):
                f.write(chunk)
        downloaded_assets.add(url)
        print(f"  [asset] {url}")
        return local
    except Exception as e:
        print(f"  [WARN]  {url}: {e}")
        return None


def rewrite_css_urls(css_text: str, css_url: str, css_local: Path) -> str:
    def replacer(m):
        raw = m.group(1).strip("'\"")
        if raw.startswith("data:") or raw.startswith("#"):
            return m.group(0)
        abs_url = normalize_url(raw, css_url)
        local = download_asset(abs_url)
        if local:
            try:
                r = str(local.relative_to(OUTPUT_DIR)).replace("\\", "/")
                return f"url('/{r}')"
            except ValueError:
                pass
        return m.group(0)
    return re.sub(r'url\(([^)]+)\)', replacer, css_text)


def process_css(url: str):
    if url in downloaded_assets:
        return
    try:
        resp = SESSION.get(url, timeout=20)
        if resp.status_code != 200:
            return
        local = safe_asset_path(url)
        local.parent.mkdir(parents=True, exist_ok=True)
        css = rewrite_css_urls(resp.text, url, local)
        local.write_text(css, encoding="utf-8")
        downloaded_assets.add(url)
        print(f"  [css]   {url}")
    except Exception as e:
        print(f"  [WARN]  CSS {url}: {e}")


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
        process_css(abs_url)
        local = safe_asset_path(abs_url)
        tag["href"] = rel_path(local, page_local)

    # Scripts
    for tag in soup.find_all("script", src=True):
        abs_url = normalize_url(tag["src"], url)
        local = download_asset(abs_url)
        if local:
            tag["src"] = rel_path(local, page_local)

    # Images
    for tag in soup.find_all("img"):
        for attr in ("src", "data-src"):
            val = tag.get(attr, "")
            if val and not val.startswith("data:"):
                abs_url = normalize_url(val, url)
                local = download_asset(abs_url)
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

    # Source tags (picture)
    for tag in soup.find_all("source"):
        for attr in ("src", "srcset", "data-src"):
            val = tag.get(attr, "")
            if val and not val.startswith("data:"):
                abs_url = normalize_url(val, url)
                local = download_asset(abs_url)
                if local:
                    tag[attr] = rel_path(local, page_local)

    # Data attributes (lazy load / sliders)
    for attr in ("data-bg", "data-thumb", "data-lazy", "data-src"):
        for tag in soup.find_all(attrs={attr: True}):
            val = tag[attr]
            if val and not val.startswith("data:"):
                abs_url = normalize_url(val, url)
                local = download_asset(abs_url)
                if local:
                    tag[attr] = rel_path(local, page_local)

    # Inline styles
    for tag in soup.find_all(style=True):
        def replacer(m, _url=url, _pl=page_local):
            raw = m.group(1).strip("'\"")
            if raw.startswith("data:") or raw.startswith("#"):
                return m.group(0)
            abs_u = normalize_url(raw, _url)
            local = download_asset(abs_u)
            if local:
                try:
                    r = str(local.relative_to(OUTPUT_DIR)).replace("\\", "/")
                    return f"url('/{r}')"
                except ValueError:
                    pass
            return m.group(0)
        tag["style"] = re.sub(r'url\(([^)]+)\)', replacer, tag["style"])

    # Links
    for tag in soup.find_all("a", href=True):
        href = tag["href"]
        if href.startswith("#") or href.startswith("/#"):
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
            local = safe_page_path(abs_url)
            tag["href"] = rel_path(local, page_local)

    # Save
    page_local.parent.mkdir(parents=True, exist_ok=True)
    page_local.write_text(str(soup), encoding="utf-8")
    time.sleep(0.3)
    return found


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Crawling {BASE_URL} -> {OUTPUT_DIR}\n")

    queue = deque([BASE_URL + "/"])
    seed = ["/privacy-policy/", "/terms-and-condition/", "/blog/", "/all-blogs/"]
    for p in seed:
        queue.append(BASE_URL + p)

    while queue:
        url = queue.popleft()
        if url in visited_pages:
            continue
        new_pages = crawl_page(url)
        for p in new_pages:
            if p not in visited_pages:
                queue.append(p)

    # Final check: no long names
    long = []
    for root, dirs, files in os.walk(OUTPUT_DIR):
        for name in dirs + files:
            if len(name) > 50:
                long.append(os.path.join(root, name))

    print(f"\nDone! Pages: {len(visited_pages)}, Assets: {len(downloaded_assets)}")
    if long:
        print(f"WARNING: {len(long)} long names still found:")
        for l in long[:5]:
            print(f"  {l}")
    else:
        print("All filenames are repo-safe (<=50 chars).")
    print(f"Open: {OUTPUT_DIR / 'index.html'}")


if __name__ == "__main__":
    main()
