import pandas as pd
from datetime import datetime
from sqlalchemy import text
from extensions import db
from models import UserLog
import requests
import psycopg2
from psycopg2.extras import DictCursor
from urllib.parse import urlparse
from flask import current_app
import os


def get_db_connection():
    url = os.getenv("DATABASE_URL")
    result = urlparse(url)
    conn = psycopg2.connect(
        dbname=result.path[1:],
        user=result.username,
        password=result.password,
        host=result.hostname,
        port=result.port,
        sslmode='require',
        cursor_factory=DictCursor
    )
    return conn

def get_data(query, params=None):
    try:
        with db.engine.connect() as connection:
            result = pd.read_sql_query(text(query), connection, params=params)
        return result
    except Exception as e:
        raise e

def parse_date(date_str):
    formats = ["%Y-%m-%d", "%a, %d %b %Y %H:%M:%S %Z"]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Date {date_str} is not in a recognized format.")

def calculate_date_range(start_date, end_date):
    current_date = pd.to_datetime(start_date)
    end = pd.to_datetime(end_date)
    date_array = []
    while current_date <= end:
        date_array.append(current_date.strftime("%Y-%m-%d"))
        current_date += pd.DateOffset(days=1)
    return date_array


def log_user_activity(user_name, email, ip_address, session_id, page_accessed):
    location = get_location_from_ip(ip_address)
    if not location.strip(", "):  
        location = "Unknown"
    user_log = UserLog(
        user_name=user_name,
        email=email,
        ip_address=ip_address,
        session_id=session_id,
        location=location,
        page_accessed=page_accessed
    )
    db.session.add(user_log)
    db.session.commit()


def get_location_from_ip(ip_address):
    try:
        response = requests.get(f"https://ipinfo.io/{ip_address}/json")
        if response.status_code == 200:
            data = response.json()
            city = data.get("city", "")
            region = data.get("region", "")
            country = data.get("country", "")
            if city or region or country:
                return f"{city}, {region}, {country}".strip(", ")
    except Exception as e:
        print(f"Error fetching location: {e}")
    return "Unknown"
