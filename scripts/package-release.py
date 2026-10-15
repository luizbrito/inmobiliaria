"""Package source only: python scripts/package-release.py 2026-10-15."""
from pathlib import Path
from datetime import date
import json
import sys
import zipfile
import hashlib

root = Path(__file__).resolve().parent.parent
release_date = date.fromisoformat(sys.argv[1]).isoformat()
version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
release_dir = root / 'releases'
release_dir.mkdir(exist_ok=True)
archive = release_dir / f'confianza-hostinger-{version}-{release_date}.zip'
files = [p for p in root.iterdir() if p.is_file() and (p.suffix in ['.mjs', '.md'] or p.name in ['package.json', 'package-lock.json', '.gitignore'])]
for directory in ['core', 'public', 'scripts']:
    files.extend(p for p in (root / directory).rglob('*') if p.is_file() and p.suffix in ['.mjs', '.js', '.json', '.html', '.css', '.svg', '.jpg', '.png', '.webp', '.py'])
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as output:
    for file in sorted(files):
        relative = file.relative_to(root)
        assert not any(part in ['node_modules', 'data', 'releases', '__pycache__'] for part in relative.parts)
        assert file.name != '.env' and not file.name.startswith('.env.')
        output.write(file, relative.as_posix())
with zipfile.ZipFile(archive) as output:
    assert output.testzip() is None
    assert {'package.json', 'package-lock.json', 'server.mjs', 'public/portal/presentation.js', 'core/commercial.mjs'}.issubset(output.namelist())
checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
archive.with_suffix('.zip.sha256').write_text(f'{checksum}  {archive.name}\n', encoding='utf-8')
print(f'{archive.name}: {len(files)} files, {archive.stat().st_size} bytes')
