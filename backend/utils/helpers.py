import pandas as pd
from datetime import datetime
from sqlalchemy import text
from extensions import db

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
