from pathlib import Path


def format_size(size: int) -> str:
    """Mengubah ukuran file menjadi format yang mudah dibaca."""

    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024

    return f"{size:.1f} PB"


def safe_path(root: Path, relative_path: str) -> Path:
    """
    Menghasilkan path yang aman agar tidak bisa keluar dari folder shared.
    """

    root = root.resolve()

    target = (root / relative_path).resolve()

    if target != root and root not in target.parents:
        raise ValueError("Invalid path")

    return target


def list_items(folder: Path, root: Path):
    """
    Mengambil daftar file dan folder.
    """

    items = []

    for item in sorted(
        folder.iterdir(),
        key=lambda x: (x.is_file(), x.name.lower())
    ):

        stat = item.stat()

        items.append({
            "name": item.name,
            "dir": item.is_dir(),
            "size": "-" if item.is_dir() else format_size(stat.st_size),
            "modified": stat.st_mtime,
            "path": item.relative_to(root).as_posix(),
            "extension": item.suffix.lower(),
        })

    return items