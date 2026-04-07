#!/usr/bin/env python3
"""
Rename long URL-encoded directory names to short slugs,
then update all href/src references in every HTML file.
"""
import os
import re
import urllib.parse
from pathlib import Path

BASE = Path("c:/Users/Administrator/Downloads/Writerity/katsumok.com")
MAX_LEN = 50  # rename dirs longer than this


def decode_slug(name: str) -> str:
    """Try to decode URL-encoded name into a readable ASCII slug."""
    try:
        decoded = urllib.parse.unquote(name, encoding="utf-8")
    except Exception:
        decoded = name
    # Strip non-ASCII, lowercase, replace spaces/special chars with hyphens
    ascii_part = re.sub(r'[^\x00-\x7F]+', '', decoded)
    ascii_part = re.sub(r'[^a-zA-Z0-9]+', '-', ascii_part).strip('-').lower()
    return ascii_part[:60] if ascii_part else ""


def main():
    # 1. Build rename map: old_name -> new_name
    rename_map = {}  # old dir name -> new dir name
    used_names = set()

    # Collect all dirs that need renaming
    to_rename = [
        name for name in os.listdir(BASE)
        if os.path.isdir(BASE / name) and len(name) > MAX_LEN
    ]

    # Sort for determinism
    for i, old_name in enumerate(sorted(to_rename), 1):
        slug = decode_slug(old_name)
        candidate = f"post-{i:03d}"
        if slug:
            # Prefer readable slug if it's short enough and unique
            short = slug[:40].strip('-')
            if short and short not in used_names:
                candidate = short
        # Ensure uniqueness
        base_candidate = candidate
        counter = 2
        while candidate in used_names:
            candidate = f"{base_candidate}-{counter}"
            counter += 1
        used_names.add(candidate)
        rename_map[old_name] = candidate

    print(f"Will rename {len(rename_map)} directories:")
    for old, new in list(rename_map.items())[:5]:
        print(f"  {old[:60]}... -> {new}")
    print("  ...")

    # 2. Update all HTML files first (before renaming dirs)
    html_files = list(BASE.rglob("*.html"))
    print(f"\nUpdating {len(html_files)} HTML files...")

    for html_path in html_files:
        try:
            content = html_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        changed = False
        for old_name, new_name in rename_map.items():
            if old_name in content:
                content = content.replace(old_name, new_name)
                changed = True

        if changed:
            html_path.write_text(content, encoding="utf-8")
            print(f"  updated: {html_path.relative_to(BASE)}")

    # 3. Rename directories
    print(f"\nRenaming directories...")
    for old_name, new_name in rename_map.items():
        old_path = BASE / old_name
        new_path = BASE / new_name
        if old_path.exists():
            old_path.rename(new_path)
            print(f"  {old_name[:50]}... -> {new_name}")

    print(f"\nDone! Renamed {len(rename_map)} directories.")


if __name__ == "__main__":
    main()
