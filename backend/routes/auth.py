import datetime
import logging
import re

import jwt
from extensions import db
from flask import Blueprint, jsonify, request
from models import User, UserLog
from utils.helpers import log_user_activity
from werkzeug.security import check_password_hash, generate_password_hash

auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger(__name__)

SECRET_KEY = "XP&O%<w}?g,uqY[lM/s/kc=?wU2Mj$"

# Predefined access tokens for demonstration purposes
ACCESS_TOKENS = {"MMT"}


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    access_token = data.get("access_token")

    if not access_token or access_token not in ACCESS_TOKENS:
        return jsonify({"message": "Invalid or missing access token"}), 403

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"message": "Missing required fields"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already taken"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 400

    if len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters long"}), 400

    if len(re.findall(r"\d", password)) < 1:
        return jsonify({"message": "Password must contain at least 1 digit"}), 400

    if len(re.findall(r"\W", password)) < 1:
        return (
            jsonify({"message": "Password must contain at least 1 special character"}),
            400,
        )

    hashed_password = generate_password_hash(password, method="pbkdf2:sha256")

    new_user = User(username=username, email=email, password_hash=hashed_password)

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    identifier = data.get("identifier")  # This can be either username or email
    password = data.get("password")
    ip_address = data.get("ip_address")  # Get the IP address from the request body

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid credentials"}), 401

    token = jwt.encode(
        {
            "username": user.username,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1),
        },
        SECRET_KEY,
        algorithm="HS256",
    )

    session_id = token  # Using the token as the session ID for simplicity
    log_user_activity(user.username, user.email, ip_address, session_id, "/login")

    # Save the token in the database
    user.token = token
    db.session.commit()

    return jsonify({"token": token, "message": "Login successful"}), 200


@auth_bp.route("/user", methods=["GET"])
def get_user():
    token = request.headers.get("Authorization").split()[1]

    if not token:
        return jsonify({"message": "Token is missing!"}), 403

    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user = User.query.filter_by(username=data["username"]).first()
        if not user:
            return jsonify({"message": "User not found"}), 404
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 401

    return jsonify({"username": user.username, "email": user.email}), 200


@auth_bp.route("/user/password", methods=["PUT"])
def update_password():
    token = request.headers.get("Authorization").split()[1]

    if not token:
        return jsonify({"message": "Token is missing!"}), 403

    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user = User.query.filter_by(username=data["username"]).first()
        if not user:
            return jsonify({"message": "User not found"}), 404
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 401

    data = request.get_json()
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    confirm_new_password = data.get("confirm_new_password")

    if not check_password_hash(user.password_hash, current_password):
        return jsonify({"message": "Current password is incorrect"}), 400

    if new_password != confirm_new_password:
        return jsonify({"message": "New passwords do not match"}), 400

    if len(new_password) < 8:
        return jsonify({"message": "Password must be at least 8 characters long"}), 400

    if len(re.findall(r"\d", new_password)) < 1:
        return jsonify({"message": "Password must contain at least 1 digit"}), 400

    if len(re.findall(r"\W", new_password)) < 1:
        return (
            jsonify({"message": "Password must contain at least 1 special character"}),
            400,
        )

    user.password_hash = generate_password_hash(new_password, method="pbkdf2:sha256")

    db.session.commit()
    return jsonify({"message": "Password updated successfully"}), 200


@auth_bp.route("/log", methods=["POST"])
def log_activity():
    data = request.get_json()
    logger.debug(f"Received log data: {data}")

    user_name = data.get("user_name")
    email = data.get("email")
    ip_address = data.get("ip_address")
    session_id = data.get("session_id")
    page_accessed = data.get("page_accessed")

    logger.debug(
        f"Extracted data - user_name: {user_name}, email: {email}, ip_address: {ip_address}, session_id: {session_id}, page_accessed: {page_accessed}"
    )

    if not email:
        logger.error("Email is missing")
        return jsonify({"message": "Email is missing"}), 400

    try:
        log_user_activity(user_name, email, ip_address, session_id, page_accessed)
        logger.info("Activity logged successfully")
        return jsonify({"message": "Activity logged"}), 200

    except Exception as e:
        logger.error(f"Error logging activity: {e}")
        return jsonify({"message": "Internal server error"}), 500
