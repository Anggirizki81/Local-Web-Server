from pathlib import Path
from flask import jsonify

from flask import (
    Blueprint,
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

    return render_template(
        "index.html",
        items=items,
        current_path=current_path,
    )


@browser_bp.route("/upload", methods=["POST"])
def upload():

    current_path = request.form.get("path", "")

    root = Path(current_app.config["SHARED_FOLDER"])

    folder = safe_path(root, current_path)

    file = request.files.get("file")

    if not file:
        return jsonify({
            "success": False,
            "message": "No file"
        })

    file.save(folder / file.filename)

    return jsonify({
        "success": True,
        "filename": file.filename
    })


@browser_bp.route("/download/<path:file_path>")
def download(file_path):

    root = Path(current_app.config["SHARED_FOLDER"])

    file = safe_path(root, file_path)

    return send_from_directory(
        file.parent,
        file.name,
        as_attachment=True
    )


@browser_bp.route("/delete/<path:file_path>")
def delete(file_path):

    root = Path(current_app.config["SHARED_FOLDER"])

    file = safe_path(root, file_path)

    if file.exists() and file.is_file():
        file.unlink()

    parent = Path(file_path).parent.as_posix()

    if parent == ".":
        parent = ""

    return redirect(f"/?path={parent}")