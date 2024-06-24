# app.py
import os
import logging
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from extensions import db, migrate, cache

# Load environment variables
load_dotenv()

# Flask application setup
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['CACHE_TYPE'] = "SimpleCache"
app.config['CACHE_DEFAULT_TIMEOUT'] = 300

# Initialize extensions with the app
db.init_app(app)
migrate.init_app(app, db)
cache.init_app(app)
CORS(app)

# Logging setup
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

# Register blueprints
from routes.events import events_bp
from routes.dashboard import dashboard_bp
from routes.map import map_bp
from routes.parking import parking_bp
from routes.data import data_bp

app.register_blueprint(events_bp, url_prefix='/events')
app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
app.register_blueprint(map_bp, url_prefix='/map')
app.register_blueprint(parking_bp, url_prefix='/parking')
app.register_blueprint(data_bp, url_prefix='/data')

# Function to print all registered routes
def list_routes():
    output = []
    for rule in app.url_map.iter_rules():
        methods = ','.join(sorted(rule.methods))
        line = f"{rule.endpoint}: {methods} {rule}"
        output.append(line)

    for line in sorted(output):
        print(line)

# Print all routes to console
list_routes()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
