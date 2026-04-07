#!/usr/bin/env python3
"""
Rename long URL-encoded directory names to short slugs (recursive),
then update all href/src references in every HTML file.
"""
import os
import re
import urllib.parse
from pathlib import Path

import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = Path("c:/Users/Administrator/Downloads/Writerity/bantenya.jp")
MAX_LEN = 50


def decode_slug(name: str) -> str:
    try:
        decoded = urllib.parse.unquote(name, encoding="utf-8")
    except Exception:
        decoded = name
    ascii_part = re.sub(r'[^\x00-\x7F]+', '', decoded)
    ascii_part = re.sub(r'[^a-zA-Z0-9]+', '-', ascii_part).strip('-').lower()
    return ascii_part[:50] if ascii_part else ""


def collect_long_dirs(base: Path) -> list[Path]:
    """Walk tree bottom-up and collect dirs with long basenames."""
    result = []
    for root, dirs, files in os.walk(base, topdown=False):
        for d in dirs:
            if len(d) > MAX_LEN:
                result.append(Path(root) / d)
    return result


def main():
    long_dirs = collect_long_dirs(BASE)
    print(f"Found {len(long_dirs)} long-named directories\n")

    # Build rename map: old_path -> new_path
    rename_map = {}
    used_per_parent: dict[Path, set] = {}

    for old_path in sorted(long_dirs):
        parent = old_path.parent
        if parent not in used_per_parent:
            # Pre-populate with existing short names so we don't collide
            used_per_parent[parent] = {
                d for d in os.listdir(parent)
                if os.path.isdir(parent / d) and len(d) <= MAX_LEN
            }

        slug = decode_slug(old_path.name)
        candidate = f"post-{len(rename_map)+1:03d}" if not slug else slug[:40].strip('-')
        if not candidate:
            candidate = f"post-{len(rename_map)+1:03d}"

        base_candidate = candidate
        counter = 2
        while candidate in used_per_parent[parent]:
            candidate = f"{base_candidate}-{counter}"
            counter += 1

        used_per_parent[parent].add(candidate)
        new_path = parent / candidate
        rename_map[old_path] = new_path

    # Update all HTML files first
    html_files = list(BASE.rglob("*.html"))
    print(f"Updating {len(html_files)} HTML files...")
    for html_path in html_files:
        try:
            content = html_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        changed = False
        for old_path, new_path in rename_map.items():
            old_name = old_path.name
            new_name = new_path.name
            if old_name in content:
                content = content.replace(old_name, new_name)
                changed = True
        if changed:
            html_path.write_text(content, encoding="utf-8")
            print(f"  updated: {html_path.relative_to(BASE)}")

    # Rename dirs bottom-up (deepest first so parent renames don't break children)
    print(f"\nRenaming {len(rename_map)} directories...")
    for old_path, new_path in sorted(rename_map.items(), key=lambda x: -len(x[0].parts)):
        if old_path.exists():
            old_path.rename(new_path)
            print(f"  {old_path.name[:50]}... -> {new_path.name}")
        else:
            print(f"  [SKIP - not found] {old_path.name[:50]}")

    # Verify
    remaining = collect_long_dirs(BASE)
    print(f"\nDone! Long dirs remaining: {len(remaining)}")


if __name__ == "__main__":
    main()
