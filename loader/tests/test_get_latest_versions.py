from src import get_latest_versions
from src.get_latest_versions import copy_latest_versions


def make_release(root, name):
    release = root / name
    release.mkdir(parents=True)
    (release / 'VERSION').write_text(name)


def copied(dest):
    """Map each output folder to the release it was copied from."""
    return {p.name: (p / 'VERSION').read_text() for p in dest.iterdir()}


def test_copies_latest_release_of_each_major_version(tmp_path):
    src = tmp_path / 'pango_data'
    for name in ['2023-08-11_1.0', '2024-11-22_2.0', '2024-12-03_2.0.1', '2026-01-05_2.0.7']:
        make_release(src, name)

    copy_latest_versions(src, tmp_path / 'input')

    assert copied(tmp_path / 'input') == {
        'pango-1': '2023-08-11_1.0',
        'pango-2': '2026-01-05_2.0.7',
    }


def test_compares_versions_numerically(tmp_path):
    src = tmp_path / 'pango_data'
    for name in ['2025-01-01_2.0.9', '2025-02-01_2.0.10']:
        make_release(src, name)

    copy_latest_versions(src, tmp_path / 'input')

    assert copied(tmp_path / 'input') == {'pango-2': '2025-02-01_2.0.10'}


def test_ignores_entries_that_are_not_release_folders(tmp_path):
    src = tmp_path / 'pango_data'
    for name in ['2024-11-22_2.0', '2024-12-01_2.1-rc1', '2024-12-01', 'scratch']:
        make_release(src, name)
    (src / 'README.md').write_text('notes')
    (src / '2025-01-01_3.0').write_text('a file, not a folder')

    copy_latest_versions(src, tmp_path / 'input')

    assert copied(tmp_path / 'input') == {'pango-2': '2024-11-22_2.0'}


def test_uses_prefix_and_creates_destination(tmp_path):
    src = tmp_path / 'pango_data'
    make_release(src, '2024-11-22_2.0')
    dest = tmp_path / 'downloads' / 'input'

    copy_latest_versions(src, dest, prefix='test')

    assert copied(dest) == {'test-2': '2024-11-22_2.0'}


def test_main(tmp_path, run_main):
    src = tmp_path / 'pango_data'
    make_release(src, '2024-11-22_2.0')

    run_main(get_latest_versions, '-i', src, '-o', tmp_path / 'input')

    assert copied(tmp_path / 'input') == {'pango-2': '2024-11-22_2.0'}


def test_minor_release_supersedes_older_minor_of_same_major(tmp_path):
    src = tmp_path / 'pango_data'
    for name in ['2025-10-12_2.0.5', '2026-03-01_2.1.0']:
        make_release(src, name)

    copy_latest_versions(src, tmp_path / 'input')

    # The folder name becomes the index prefix (pango-2-...) the API and site query.
    assert copied(tmp_path / 'input') == {'pango-2': '2026-03-01_2.1.0'}
