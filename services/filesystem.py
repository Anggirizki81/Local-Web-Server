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

def search_items(root: Path, query: str):
    """
    Mencari file dan folder berdasarkan nama
    di seluruh shared folder dan subfolder.
    """

    results = []

    query = query.strip().lower()

    if not query:
        return results

    for item in root.rglob("*"):

        if query not in item.name.lower():
            continue

        stat = item.stat()

        results.append({
            "name": item.name,
            "dir": item.is_dir(),
            "size": "-" if item.is_dir() else format_size(stat.st_size),
            "modified": stat.st_mtime,
            "path": item.relative_to(root).as_posix(),
            "extension": item.suffix.lower(),
        })

    results.sort(
        key=lambda x: (not x["dir"], x["name"].lower())
    )

    return results

# ====Favorites Management====
import json

FAVORITES_FILE = Path("data/favorites.json")

def get_favorites():
    if not FAVORITES_FILE.exists():
        return []

    try:
        with open(FAVORITES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        return data.get("favorites", [])

    except (json.JSONDecodeError, OSError):
        return []


def save_favorites(favorites):
    FAVORITES_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(FAVORITES_FILE, "w", encoding="utf-8") as f:
        json.dump(
            {"favorites": favorites},
            f,
            indent=4,
            ensure_ascii=False
        )


def add_favorite(path):
    favorites = get_favorites()

    if path not in favorites:
        favorites.append(path)
        save_favorites(favorites)

    return favorites


def remove_favorite(path):
    favorites = get_favorites()

    if path in favorites:
        favorites.remove(path)
        save_favorites(favorites)

    return favorites

# ============================================


# ====Recent Management====
RECENT_FILE = Path("data/recent.json")
MAX_RECENT = 5

def get_recent():
    if not RECENT_FILE.exists():
        return []

    try:
        with open(RECENT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        return data.get("recent", [])

    except (json.JSONDecodeError, OSError):
        return []


def save_recent(recent):
    RECENT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(RECENT_FILE, "w", encoding="utf-8") as f:
        json.dump(
            {"recent": recent},
            f,
            indent=4,
            ensure_ascii=False
        )


def add_recent(path):
    recent = get_recent()

    # Jika sudah ada, hapus dulu supaya dipindahkan ke posisi paling atas
    if path in recent:
        recent.remove(path)

    # Folder terbaru berada di paling atas
    recent.insert(0, path)

    # Maksimal 5 folder
    recent = recent[:MAX_RECENT]

    save_recent(recent)

    return recent


# ============================================

