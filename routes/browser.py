from pathlib import Path, PurePosixPath
from flask import send_file
from werkzeug.utils import secure_filename
import shutil
from flask import (
    Blueprint,
    jsonify,
    current_app,
    redirect,
    render_template,
    request,
    send_from_directory,
)

from services.filesystem import list_items, safe_path

browser_bp = Blueprint("browser", __name__)


@browser_bp.route("/")
def index():

    current_path = request.args.get("path", "")

    root = Path(current_app.config["SHARED_FOLDER"])

    try:
        folder = safe_path(root, current_path)
    except ValueError:
        return "Invalid Path", 400

    items = list_items(folder, root)

    # ===== Tambahkan bagian ini =====
    if current_path:
        parent = str(PurePosixPath(current_path).parent)
        if parent == ".":
            parent = ""
        back_url = f"/?path={parent}"
    else:
        back_url = None
    # ================================

    return render_template(
        "index.html",
        items=items,
        current_path=current_path,
        back_url=back_url,   # Tambahkan ini
    )

@browser_bp.route("/upload", methods=["POST"])
def upload():

    current_path = request.form.get("path", "")

    root = Path(current_app.config["SHARED_FOLDER"])

    try:
        folder = safe_path(root, current_path)
    except ValueError:
        return jsonify({
            "success": False,
            "message": "Invalid path"
        }), 400

    file = request.files.get("file")

    if not file:
        return jsonify({
            "success": False,
            "message": "No file"
        }), 400

    if not file.filename:
        return jsonify({
            "success": False,
            "message": "Invalid filename"
        }), 400

    filename = secure_filename(file.filename)

    if not filename:
        return jsonify({
            "success": False,
            "message": "Invalid filename"
        }), 400

    destination = folder / filename

    try:

        file.save(destination)

    except OSError as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    return jsonify({
        "success": True,
        "filename": filename
    })


@browser_bp.route("/download/<path:file_path>")
def download(file_path):

    root = Path(current_app.config["SHARED_FOLDER"])

    try:
        file = safe_path(root, file_path)
    except ValueError:
        return jsonify({
            "success": False,
            "message": "Path tidak valid."
        }), 400

    if not file.exists() or not file.is_file():
        return jsonify({
            "success": False,
            "message": "File tidak ditemukan."
        }), 404

    return send_file(
        file,
        as_attachment=True,
        download_name=file.name
    )

@browser_bp.route("/new-folder", methods=["POST"])
def new_folder():

    current_path = request.form.get("path", "")

    folder_name = request.form.get("name", "").strip()

    if not folder_name:

        return jsonify({
            "success": False,
            "message": "Folder name required"
        }), 400

    root = Path(current_app.config["SHARED_FOLDER"])

    folder = safe_path(root, current_path)

    new_dir = folder / folder_name

    if new_dir.exists():

        return jsonify({
            "success": False,
            "message": "Folder already exists"
        }), 400

    new_dir.mkdir()

    return jsonify({
        "success": True
    })

@browser_bp.route("/rename", methods=["POST"])
def rename():

    current_path = request.form.get("path", "")
    old_name = request.form.get("old_name", "").strip()
    new_name = request.form.get("new_name", "").strip()

    # Validasi nama
    if not old_name or not new_name:
        return jsonify({
            "success": False,
            "message": "Nama file atau folder tidak boleh kosong."
        }), 400

    # Cegah path traversal melalui nama baru/lama
    if (
        Path(old_name).name != old_name
        or Path(new_name).name != new_name
        or old_name in {".", ".."}
        or new_name in {".", ".."}
    ):
        return jsonify({
            "success": False,
            "message": "Nama tidak valid."
        }), 400

    root = Path(current_app.config["SHARED_FOLDER"])

    try:
        folder = safe_path(root, current_path)
    except ValueError:
        return jsonify({
            "success": False,
            "message": "Path tidak valid."
        }), 400

    old_path = folder / old_name
    new_path = folder / new_name

    # Pastikan file/folder sumber benar-benar berada di folder aktif
    try:
        old_path.resolve().relative_to(root.resolve())
        new_path.resolve().relative_to(root.resolve())
    except ValueError:
        return jsonify({
            "success": False,
            "message": "Akses tidak diizinkan."
        }), 403

    # File/folder lama tidak ditemukan
    if not old_path.exists():
        return jsonify({
            "success": False,
            "message": "File atau folder tidak ditemukan."
        }), 404

    # Nama baru sudah digunakan
    if new_path.exists():
        return jsonify({
            "success": False,
            "message": "Nama tersebut sudah digunakan."
        }), 400

    try:
        old_path.rename(new_path)

        return jsonify({
            "success": True,
            "message": "Berhasil diubah.",
            "old_name": old_name,
            "new_name": new_name
        })

    except OSError as e:
        return jsonify({
            "success": False,
            "message": f"Gagal mengubah nama: {str(e)}"
        }), 500

@browser_bp.route("/delete", methods=["POST"])
def delete():

    current_path = request.form.get("path", "")
    name = request.form.get("name", "").strip()

    if not name:
        return jsonify({
            "success": False,
            "message": "Nama file atau folder tidak valid."
        }), 400

    # Cegah akses ke path di luar folder aktif
    if (
        Path(name).name != name
        or name in {".", ".."}
    ):
        return jsonify({
            "success": False,
            "message": "Nama tidak valid."
        }), 400

    root = Path(current_app.config["SHARED_FOLDER"])

    try:
        folder = safe_path(root, current_path)
    except ValueError:
        return jsonify({
            "success": False,
            "message": "Path tidak valid."
        }), 400

    target = folder / name

    try:
        target.resolve().relative_to(root.resolve())
    except ValueError:
        return jsonify({
            "success": False,
            "message": "Akses tidak diizinkan."
        }), 403

    if not target.exists():
        return jsonify({
            "success": False,
            "message": "File atau folder tidak ditemukan."
        }), 404

    try:
        if target.is_dir():
            shutil.rmtree(target)
        else:
            target.unlink()

        return jsonify({
            "success": True,
            "message": "Berhasil dihapus."
        })

    except OSError as e:
        return jsonify({
            "success": False,
            "message": f"Gagal menghapus: {str(e)}"
        }), 500