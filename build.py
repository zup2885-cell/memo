"""Build the offline-capable browser prototype and its download package."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from prototype.build import build_fragment

ROOT = Path(__file__).resolve().parent


def main():
    fragment = build_fragment()
    # Browser storage has its own quota and reports errors; the inline host's
    # 16 KiB snapshot cap must not silently stop saving the standalone app.
    host_limit = "    if(new TextEncoder().encode(JSON.stringify(payload)).length>16000)return;\n"
    assert fragment.count(host_limit) == 1
    fragment = fragment.replace(host_limit, '')
    fragment = fragment.replace('已暂存于本轮预览', '记录保存在本机')
    shell = (ROOT / 'web/shell.html').read_text(encoding='utf-8')
    shell = shell.replace('__MEMO_STORAGE__', (ROOT / 'web/storage.js').read_text(encoding='utf-8'))
    document = shell.replace('__MEMO_PUBLIC_APP__', fragment)
    assert '__MEMO_' not in document
    (ROOT / 'index.html').write_text(document, encoding='utf-8')
    (ROOT / '.nojekyll').touch()
    distribution = ROOT / 'dist'
    distribution.mkdir(exist_ok=True)
    with ZipFile(distribution / 'memo-web.zip', 'w', ZIP_DEFLATED) as archive:
        for name in ['index.html', 'README.md', 'LICENSE', 'vendor/lucide.min.js', 'vendor/LICENSE-lucide']:
            archive.write(ROOT / name, f'memo/{name}')
    print(f'Built index.html: {len(document.encode()):,} bytes')
    print('Built dist/memo-web.zip')


if __name__ == '__main__':
    main()
