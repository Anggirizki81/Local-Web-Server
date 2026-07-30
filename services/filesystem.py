from pathlib import Path


def format_size(size):
    """Mengubah ukuran byte menjadi format yang mudah dibaca."""

    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024

    return f"{size:.1f} PB"


def list_items(folder: Path):
    """Mengambil daftar file dan folder."""

    items = []

    for item in sorted(folder.iterdir(), key=lambda x: (x.is_file(), x.name.lower())):

        items.append({
            "name": item.name,
            "dir": item.is_dir(),
            "size": "-" if item.is_dir() else format_size(item.stat().st_size),
            "modified": item.stat().st_mtime,
        })

    return items