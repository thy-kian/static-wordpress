#!/usr/bin/env python3
"""
Static site crawler - mirrors gamenic-virtual-studio.com locally
"""
import os
import re
import time
import hashlib
import urllib.parse
from pathlib import Path
from collections import deque

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://gamenic-virtual-studio.com"
OUTPUT_DIR = Path("c:/Users/Administrator/Downloads/Writerity/gamenic-virtual-studio.com")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"
}
SESSION = requests.Session()
SESSION.headers.update(HEADERS)

visited_pages = set()
downloaded_assets = set()


def url_to_local_path(url: str) -> Path:
    parsed = urllib.parse.urlparse(url)
    path = parsed.path.strip("/")  # strip both leading and trailing slashes
    if parsed.query:
        qhash = hashlib.md5(parsed.query.encode()).hexdigest()[:8]
        base, ext = os.path.splitext(path)
        path = f"{base}_{qhash}{ext}" if (base or ext) else f"index_{qhash}.html"
    if not path:
        path = "index.html"
    elif path.endswith("/") or "." not in os.path.basename(path):
        path = path.rstrip("/") + "/index.html"
    return OUTPUT_DIR / path


def is_same_domain(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    return parsed.netloc in ("", "gamenic-virtual-studio.com", "www.gamenic-virtual-studio.com")


def normalize_url(url: str, base: str) -> str:
    url = url.strip()
    if url.startswith("//"):
        url = "https:" + url
    url = urllib.parse.urljoin(base, url)
    # Remove fragment
    url = urllib.parse.urldefrag(url)[0]
    # Normalize trailing slash for pages
    return url


def download_asset(url: str) -> str | None:
    """Download a static asset and return its local relative path."""
    if url in downloaded_assets:
        local = url_to_local_path(url)
        return str(local.relative_to(OUTPUT_DIR))

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
        return str(local.relative_to(OUTPUT_DIR)).replace("\\", "/")
    except Exception as e:
        print(f"  [WARN] Failed asset {url}: {e}")
        return None


def rewrite_css_urls(css_text: str, css_url: str) -> str:
    """Download assets referenced in CSS and rewrite their URLs."""
    def replacer(m):
        raw = m.group(1).strip("'\"")
        if raw.startswith("data:") or raw.startswith("#"):
            return m.group(0)
        abs_url = normalize_url(raw, css_url)
        local = download_asset(abs_url)
        if local:
            return f"url('{local}')"
        return m.group(0)
    return re.sub(r'url\(([^)]+)\)', replacer, css_text)


def process_css_file(url: str):
    """Download CSS file, rewrite its internal URLs, save it."""
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
    """Fetch a page, save it with rewritten local URLs, return found page links."""
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

    # --- Rewrite <link rel="stylesheet"> ---
    for tag in soup.find_all("link", rel=lambda r: r and "stylesheet" in r):
        href = tag.get("href", "")
        if not href:
            continue
        abs_url = normalize_url(href, url)
        if is_same_domain(abs_url) or abs_url.startswith("https://"):
            process_css_file(abs_url)
            local = url_to_local_path(abs_url)
            try:
                rel = local.relative_to(url_to_local_path(url).parent)
                tag["href"] = str(rel).replace("\\", "/")
            except ValueError:
                # Cross-drive or can't make relative — use root-relative
                tag["href"] = "/" + str(local.relative_to(OUTPUT_DIR)).replace("\\", "/")

    # --- Rewrite <script src> ---
    for tag in soup.find_all("script", src=True):
        src = tag.get("src", "")
        abs_url = normalize_url(src, url)
        local_path = download_asset(abs_url)
        if local_path:
            local = url_to_local_path(abs_url)
            try:
                rel = local.relative_to(url_to_local_path(url).parent)
                tag["src"] = str(rel).replace("\\", "/")
            except ValueError:
                tag["src"] = "/" + local_path

    # --- Rewrite <img src / srcset> ---
    for tag in soup.find_all("img"):
        src = tag.get("src", "")
        if src:
            abs_url = normalize_url(src, url)
            local_path = download_asset(abs_url)
            if local_path:
                local = url_to_local_path(abs_url)
                try:
                    rel = local.relative_to(url_to_local_path(url).parent)
                    tag["src"] = str(rel).replace("\\", "/")
                except ValueError:
                    tag["src"] = "/" + local_path
        # Handle srcset
        srcset = tag.get("srcset", "")
        if srcset:
            new_parts = []
            for part in srcset.split(","):
                part = part.strip()
                if not part:
                    continue
                pieces = part.split()
                img_url = normalize_url(pieces[0], url)
                local_path = download_asset(img_url)
                if local_path:
                    local = url_to_local_path(img_url)
                    try:
                        rel = local.relative_to(url_to_local_path(url).parent)
                        pieces[0] = str(rel).replace("\\", "/")
                    except ValueError:
                        pieces[0] = "/" + local_path
                new_parts.append(" ".join(pieces))
            tag["srcset"] = ", ".join(new_parts)

    # --- Rewrite <a href> and collect internal pages ---
    for tag in soup.find_all("a", href=True):
        href = tag["href"]
        abs_url = normalize_url(href, url)
        if not is_same_domain(abs_url):
            continue
        parsed = urllib.parse.urlparse(abs_url)
        # Skip non-html resources
        ext = os.path.splitext(parsed.path)[1].lower()
        if ext in (".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".pdf",
                   ".zip", ".mp4", ".mp3", ".woff", ".woff2", ".ttf", ".eot"):
            local_path = download_asset(abs_url)
            if local_path:
                local = url_to_local_path(abs_url)
                try:
                    rel = local.relative_to(url_to_local_path(url).parent)
                    tag["href"] = str(rel).replace("\\", "/")
                except ValueError:
                    tag["href"] = "/" + local_path
        else:
            if abs_url not in visited_pages:
                found_pages.append(abs_url)
            # Rewrite to local .html path
            local = url_to_local_path(abs_url)
            try:
                rel = local.relative_to(url_to_local_path(url).parent)
                tag["href"] = str(rel).replace("\\", "/")
            except ValueError:
                tag["href"] = "/" + str(local.relative_to(OUTPUT_DIR)).replace("\\", "/")

    # --- Handle inline style background images ---
    for tag in soup.find_all(style=True):
        style = tag["style"]
        def replacer(m):
            raw = m.group(1).strip("'\"")
            if raw.startswith("data:") or raw.startswith("#"):
                return m.group(0)
            abs_u = normalize_url(raw, url)
            lp = download_asset(abs_u)
            if lp:
                return f"url('{lp}')"
            return m.group(0)
        tag["style"] = re.sub(r'url\(([^)]+)\)', replacer, style)

    # --- Handle data-src (lazy loaded images) ---
    for tag in soup.find_all(attrs={"data-src": True}):
        src = tag["data-src"]
        abs_url = normalize_url(src, url)
        local_path = download_asset(abs_url)
        if local_path:
            tag["data-src"] = "/" + local_path

    # --- Handle Elementor background images in data-settings ---
    for tag in soup.find_all(attrs={"data-settings": True}):
        settings = tag["data-settings"]
        def replacer(m):
            raw = m.group(1).strip("'\"")
            if "gamenic-virtual-studio.com" in raw or raw.startswith("/wp-content"):
                abs_u = normalize_url(raw, url)
                lp = download_asset(abs_u)
                if lp:
                    return f'"url":"{lp}"'
            return m.group(0)
        tag["data-settings"] = re.sub(r'"url":"([^"]+)"', replacer, settings)

    # Save page
    local_file = url_to_local_path(url)
    local_file.parent.mkdir(parents=True, exist_ok=True)
    local_file.write_text(str(soup), encoding="utf-8")

    time.sleep(0.3)  # polite crawl delay
    return found_pages


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Crawling {BASE_URL} -> {OUTPUT_DIR}\n")

    queue = deque([BASE_URL + "/"])

    # Known important pages to crawl
    seed_pages = [
        "/about/",
        "/services/",
        "/products/",
        "/blog/",
        "/career/",
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
