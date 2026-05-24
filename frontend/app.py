import os
from flask import Flask, render_template

app = Flask(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")

@app.route("/")
def dashboard():
    return render_template("dashboard.html", api_base=BACKEND_URL)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)