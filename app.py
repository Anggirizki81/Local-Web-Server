from flask import Flask
from routes.browser import browser_bp

app = Flask(__name__)
app.register_blueprint(browser_bp)

if __name__ == "__main__":
    app.run(...)