import os

from config import Config
from dotenv import load_dotenv
from extensions import db, migrate
from flask import Flask
from flask_cors import CORS


def create_app():
    app = Flask(__name__)
    load_dotenv()
    app.config.from_object(Config)
    CORS(app)

    db.init_app(app)
    migrate.init_app(app, db)

    from routes.auth import auth_bp
    from routes.dashboard import dashboard_bp
    from routes.data import data_bp
    from routes.events import events_bp
    from routes.map import map_bp
    from routes.parking import parking_bp
    from routes.recommendation import recommendation_bp
    from routes.allocation import allocation_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(events_bp, url_prefix="/events")
    app.register_blueprint(dashboard_bp, url_prefix="/dashboard")
    app.register_blueprint(map_bp, url_prefix="/map")
    app.register_blueprint(parking_bp, url_prefix="/parking")
    app.register_blueprint(data_bp, url_prefix="/data")
    app.register_blueprint(recommendation_bp, url_prefix="/recommendation")
    app.register_blueprint(allocation_bp, url_prefix="/allocation")

    with app.app_context():
        for rule in app.url_map.iter_rules():
            print(f"{rule.endpoint}: {rule}")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
