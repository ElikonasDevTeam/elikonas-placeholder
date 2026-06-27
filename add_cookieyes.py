"""
Inserts the CookieYes snippet immediately after the opening <head> tag
in every .html file under the current directory, skipping:
  - files that already contain the CookieYes script
  - the elikonas-product folder (Next.js app, handled separately)
  - .git / node_modules / .next folders

Run from the root of your elikonas-placeholder repo:
    python3 add_cookieyes.py
"""

import os

SNIPPET = (
    '    <!-- Start cookieyes banner -->\n'
    '    <script id="cookieyes" type="text/javascript" '
    'src="https://cdn-cookieyes.com/client_data/8991d2cf76f366b01f801203893e9ec9/script.js"></script>\n'
    '    <!-- End cookieyes banner -->\n'
)

EXCLUDE_DIRS = {".git", "node_modules", "elikonas-product", ".next"}


def process_file(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    if 'id="cookieyes"' in content:
        print(f"SKIP (already has CookieYes): {path}")
        return

    idx = content.find("<head>")
    if idx == -1:
        print(f"WARNING: no <head> tag found, skipped: {path}")
        return

    insert_at = idx + len("<head>")
    new_content = content[:insert_at] + "\n" + SNIPPET + content[insert_at:]

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"UPDATED: {path}")


def main():
    updated = 0
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for name in files:
            if name.endswith(".html"):
                process_file(os.path.join(root, name))


if __name__ == "__main__":
    main()
