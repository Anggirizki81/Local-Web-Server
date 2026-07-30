from flask import Blueprint, render_template

browser_bp = Blueprint("browser", __name__)

@browser_bp.route("/")
def index():
    return render_template("index.html")