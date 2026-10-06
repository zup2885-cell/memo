"""Build the self-contained inline prototype from editable local sources."""
from pathlib import Path
import argparse
import base64

PROJECT = Path(__file__).resolve().parent.parent
SOURCE = PROJECT / 'prototype'


def build_fragment():
    fragment = (SOURCE / 'memo.template.html').read_text(encoding='utf-8')
    for token, name in [('__MEMO_CSS__', 'memo.css'), ('__MEMO_THEME_JS__', 'theme.js'),
                        ('__MEMO_MEDIA_JS__', 'media.js'), ('__MEMO_REMINDERS_JS__', 'reminders.js'),
                        ('__MEMO_JS__', 'memo.js')]:
        fragment = fragment.replace(token, (SOURCE / name).read_text(encoding='utf-8'))
    for token, name, mime in [('__MEMO_PHOTO__', 'camper.jpg', 'image/jpeg'),
                              ('__MEMO_BELL__', 'memo-bell.wav', 'audio/wav'),
                              ('__MEMO_BREEZE__', 'memo-breeze.wav', 'audio/wav')]:
        encoded = base64.b64encode((PROJECT / 'assets' / name).read_bytes()).decode('ascii')
        fragment = fragment.replace(token, f'data:{mime};base64,{encoded}')
    assert len(fragment.encode()) < 1_000_000, 'Inline prototype must stay under 1 MB'
    return fragment


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inline-dir', type=Path, help='Optional directory for a conversation preview copy')
    args = parser.parse_args()
    fragment = build_fragment()
    demo = fragment.replace('<div id="memo-sky"', '<div id="memo-sky" data-start-reminder="true"', 1)
    destinations = [SOURCE] + ([args.inline_dir] if args.inline_dir else [])
    for destination in destinations:
        destination.mkdir(parents=True, exist_ok=True)
        for name, content in [('memo-sky.html', fragment), ('memo-reminder-demo.html', demo),
                               ('memo-fullscreen-reminder.html', demo)]:
            (destination / name).write_text(content, encoding='utf-8')
    print(f'Built inline prototype: {len(fragment.encode()):,} bytes')


if __name__ == '__main__':
    main()
