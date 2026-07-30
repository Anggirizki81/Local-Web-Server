from flask import Flask
from routes.browser import browser_bp
import config

app = Flask(__name__)

app.config["UPLOAD_FOLDER"] = config.UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = config.MAX_UPLOAD_SIZE

app.register_blueprint(browser_bp)

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=config.PORT,
        debug=config.DEBUG
    )