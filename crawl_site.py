#!/usr/bin/env python3
"""
Static site crawler - mirrors bantenya.jp locally
"""
import os
import re
import time
import hashlib
import urllib.parse
from pathlib import Path
from collections import deque

import sys
import requests
from bs4 import BeautifulSoup

# Force UTF-8 output so Japanese URLs don't crash on Windows cp1252 terminals
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "https://bantenya.jp"
OUTPUT_DIR = Path("c:/Users/Administrator/Downloads/Writerity/bantenya.jp")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"
}
SESSION = requests.Session()
SESSION.headers.update(HEADERS)

visited_pages = set()
downloaded_assets = set()


def url_to_local_path(url: str) -> Path:
    parsed = urllib.parse.urlparse(url)
    path = parsed.path.strip("/")
    if parsed.query:
        qhash = hashlib.md5(parsed.query.encode()).hexdigest()[:8]
        base, ext = os.path.splitext(path)
        path = f"{base}_{qhash}{ext}" if (base or ext) else f"index_{qhash}.html"
    if not path:
        path = "index.html"
    elif "." not in os.path.basename(path):
        path = path.rstrip("/") + "/index.html"
    return OUTPUT_DIR / path


def is_same_domain(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    return parsed.netloc in ("", "bantenya.jp", "www.bantenya.jp")


def normalize_url(url: str, base: str) -> str:
    url = url.strip()
    if url.startswith("//"):
        url = "https:" + url
    url = urllib.parse.urljoin(base, url)
    return urllib.parse.urldefrag(url)[0]


def safe_relative(local: Path, page_local: Path) -> str:
    try:
        return str(local.relative_to(page_local.parent)).replace("\\", "/")
    except ValueError:
        pass
    try:
        return "/" + str(local.relative_to(OUTPUT_DIR)).replace("\\", "/")
    except ValueError:
        return str(local).replace("\\", "/")


def download_asset(url: str) -> str | None:
    if url in downloaded_assets:
        local = url_to_local_path(url)
        try:
            return str(local.relative_to(OUTPUT_DIR)).replace("\\", "/")
        except ValueError:
            return None

    try:
        resp = SESSION.get(url, timeout=20, stream=True)
        if resp.status_code != 200:
            return None
        local = url_to_local_path(url)
        local.parent.mkdir(parents=True, exist_ok=True)
        with open(local, "wb") as f:
            for chunk in resp.iter_content(65536):
                f.write(chunk)
        downloaded_assets.add(url)
        print(f"  [asset] {url}")
        try:
            return str(local.relative_to(OUTPUT_DIR)).replace("\\", "/")
        except ValueError:
            return None
    except Exception as e:
        print(f"  [WARN] Failed asset {url}: {e}")
        return None


def rewrite_css_urls(css_text: str, css_url: str) -> str:
    def replacer(m):
        raw = m.group(1).strip("'\"")
        if raw.startswith("data:") or raw.startswith("#"):
            return m.group(0)
        abs_url = normalize_url(raw, css_url)
        download_asset(abs_url)
        local = url_to_local_path(abs_url)
        try:
            rel = str(local.relative_to(OUTPUT_DIR)).replace("\\", "/")
            return f"url('/{rel}')"
        except ValueError:
            return m.group(0)
    return re.sub(r'url\(([^)]+)\)', replacer, css_text)


def process_css_file(url: str):
    if url in downloaded_assets:
        return
    try:
        resp = SESSION.get(url, timeout=20)
        if resp.status_code != 200:
            return
        css = rewrite_css_urls(resp.text, url)
        local = url_to_local_path(url)
        local.parent.mkdir(parents=True, exist_ok=True)
        local.write_text(css, encoding="utf-8")
        downloaded_assets.add(url)
        print(f"  [css]   {url}")
    except Exception as e:
        print(f"  [WARN] Failed CSS {url}: {e}")


def crawl_page(url: str) -> list[str]:
    if url in visited_pages:
        return []
    visited_pages.add(url)

    try:
        resp = SESSION.get(url, timeout=30)
        if resp.status_code != 200:
            print(f"[SKIP] {url} -> {resp.status_code}")
            return []
    except Exception as e:
        print(f"[ERROR] {url}: {e}")
        return []

    print(f"[page]  {url}")
    soup = BeautifulSoup(resp.text, "lxml")
    found_pages = []
    page_local = url_to_local_path(url)

    # --- <link rel="stylesheet"> ---
    for tag in soup.find_all("link", rel=lambda r: r and "stylesheet" in r):
        href = tag.get("href", "")
        if not href:
            continue
        abs_url = normalize_url(href, url)
        process_css_file(abs_url)
        local = url_to_local_path(abs_url)
        tag["href"] = safe_relative(local, page_local)

    # --- <script src> ---
    for tag in soup.find_all("script", src=True):
        abs_url = normalize_url(tag["src"], url)
        download_asset(abs_url)
        local = url_to_local_path(abs_url)
        tag["src"] = safe_relative(local, page_local)

    # --- <img src / srcset / data-src> ---
    for tag in soup.find_all("img"):
        src = tag.get("src", "")
        if src and not src.startswith("data:"):
            abs_url = normalize_url(src, url)
            download_asset(abs_url)
            tag["src"] = safe_relative(url_to_local_path(abs_url), page_local)

        srcset = tag.get("srcset", "")
        if srcset:
            new_parts = []
            for part in srcset.split(","):
                part = part.strip()
                if not part:
                    continue
                pieces = part.split()
                img_url = normalize_url(pieces[0], url)
                download_asset(img_url)
                pieces[0] = safe_relative(url_to_local_path(img_url), page_local)
                new_parts.append(" ".join(pieces))
            tag["srcset"] = ", ".join(new_parts)

        data_src = tag.get("data-src", "")
        if data_src and not data_src.startswith("data:"):
            abs_url = normalize_url(data_src, url)
            download_asset(abs_url)
            tag["data-src"] = safe_relative(url_to_local_path(abs_url), page_local)

    # --- Revolution Slider data-thumb / data-src on <li> / <rs-slide> ---
    for attr in ("data-thumb", "data-src", "data-bg"):
        for tag in soup.find_all(attrs={attr: True}):
            val = tag[attr]
            if val and not val.startswith("data:"):
                abs_url = normalize_url(val, url)
                download_asset(abs_url)
                tag[attr] = safe_relative(url_to_local_path(abs_url), page_local)

    # --- <a href> ---
    for tag in soup.find_all("a", href=True):
        href = tag["href"]
        # Keep hash links as-is (SPA navigation)
        if href.startswith("#") or href.startswith("/#"):
            continue
        abs_url = normalize_url(href, url)
        if not is_same_domain(abs_url):
            continue
        parsed = urllib.parse.urlparse(abs_url)
        ext = os.path.splitext(parsed.path)[1].lower()
        if ext in (".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".pdf",
                   ".zip", ".mp4", ".mp3", ".woff", ".woff2", ".ttf", ".eot"):
            download_asset(abs_url)
            tag["href"] = safe_relative(url_to_local_path(abs_url), page_local)
        else:
            if abs_url not in visited_pages:
                found_pages.append(abs_url)
            tag["href"] = safe_relative(url_to_local_path(abs_url), page_local)

    # --- inline style url() ---
    for tag in soup.find_all(style=True):
        def replacer(m, _url=url, _pl=page_local):
            raw = m.group(1).strip("'\"")
            if raw.startswith("data:") or raw.startswith("#"):
                return m.group(0)
            abs_u = normalize_url(raw, _url)
            download_asset(abs_u)
            local = url_to_local_path(abs_u)
            try:
                rel = str(local.relative_to(OUTPUT_DIR)).replace("\\", "/")
                return f"url('/{rel}')"
            except ValueError:
                return m.group(0)
        tag["style"] = re.sub(r'url\(([^)]+)\)', replacer, tag["style"])

    # Save page
    page_local.parent.mkdir(parents=True, exist_ok=True)
    page_local.write_text(str(soup), encoding="utf-8")

    time.sleep(0.3)
    return found_pages


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Crawling {BASE_URL} -> {OUTPUT_DIR}\n")

    queue = deque([BASE_URL + "/"])

    seed_pages = [
        "/blog/",
        "/contact/",
    ]
    for p in seed_pages:
        queue.append(BASE_URL + p)

    while queue:
        url = queue.popleft()
        if url in visited_pages:
            continue
        new_pages = crawl_page(url)
        for p in new_pages:
            if p not in visited_pages:
                queue.append(p)

    print(f"\nDone! Pages: {len(visited_pages)}, Assets: {len(downloaded_assets)}")
    print(f"Open: {OUTPUT_DIR / 'index.html'}")


if __name__ == "__main__":
    main()
