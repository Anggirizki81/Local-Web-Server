from flask import Blueprint, render_template, request, send_from_directory, redirect, current_app
from pathlib import Path
import os

browser_bp = Blueprint("browser", __name__)


def get_items():
    shared = Path(current_app.config["SHARED_FOLDER"])

    items = []

    for item in sorted(shared.iterdir()):
        items.append({
            "name": item.name,
            "dir": item.is_dir(),
            "size": "-" if item.is_dir() else f"{item.stat().st_size / 1024:.1f} KB"
        })

    return items


@browser_bp.route("/")
def index():
    return render_template(
        "index.html",
        items=get_items()
    )


@browser_bp.route("/upload", methods=["POST"])
def upload():

    file = request.files.get("file")

    if file and file.filename:

        save_path = Path(current_app.config["SHARED_FOLDER"]) / file.filename

        file.save(save_path)

    return redirect("/")


@browser_bp.route("/download/<path:filename>")
def download(filename):

    return send_from_directory(
        current_app.config["SHARED_FOLDER"],
        filename,
        as_attachment=True
    )


@browser_bp.route("/delete/<path:filename>")
def delete(filename):

    path = Path(current_app.config["SHARED_FOLDER"]) / filename

    if path.exists() and path.is_file():
        path.unlink()

    return redirect("/")