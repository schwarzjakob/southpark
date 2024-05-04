import sys
import os
from flask import Flask, jsonify, request
from dotenv import load_dotenv
import psycopg2
import logging
import pandas as pd

# Append the directory above 'backend' to the path to access the 'scripts' directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import allocation_algorithm module and its functions
from scripts.allocation_algorithm import load_data, optimize_distance

# Load environment variables from .env file
load_dotenv()

# Retrieve the DATABASE_URL from environment variables
database_url = os.getenv("DATABASE_URL")

# Enabling logging (must come first to enable it globally, also for imported modules and packages)
logger_format = (
    "[%(asctime)s %(filename)s->%(funcName)s():%(lineno)d] %(levelname)s: %(message)s"
)
logging.basicConfig(format=logger_format, level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)


# Function to connect to the database
def get_db_connection():
    conn = psycopg2.connect(database_url)
    return conn


def fetch_data_from_database():
    # Fetch data from the database and return df_events_parking_lot_min_capacity
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    try:
        query = """
        SELECT e.name AS event, e.event_date AS date, e.demand,
               p.name AS parking_lot, pc.capacity, 
               pd.distance_north, pd.distance_north_east, pd.distance_east,
               pd.distance_west, pd.distance_north_west,
               e.entrance
        FROM events e
        JOIN hall_parking_distances pd ON e.hall = pd.hall
        JOIN parking_lots p ON pd.parking_lot = p.name
        JOIN parking_capacity pc ON p.name = pc.parking_lot
        WHERE pc.valid_from <= e.event_date 
        AND pc.valid_to >= e.event_date 
        AND pc.capacity >= e.demand;
        """
        df_events_parking_lot_min_capacity = pd.read_sql_query(query, conn)

        # Function to find distance based on entrance gate predefined in events
        def get_distance(row):
            entrance = row["entrance"]
            distance = row[f"distance_{entrance}"]
            return distance

        # Get the distance via the entrance gate and drop distance columns
        df_events_parking_lot_min_capacity["distance"] = (
            df_events_parking_lot_min_capacity.apply(get_distance, axis=1)
        )
        df_events_parking_lot_min_capacity.drop(
            columns=[
                "distance_north",
                "distance_north_east",
                "distance_east",
                "distance_west",
                "distance_north_west",
                "entrance",
            ],
            inplace=True,
        )

        return df_events_parking_lot_min_capacity
    finally:
        conn.close()


def optimize_and_save_results(df_events_parking_lot_min_capacity):
    # Perform optimization and save results to the database
    df_allocation_results = optimize_distance(df_events_parking_lot_min_capacity)
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    try:
        for index, row in df_allocation_results.iterrows():
            cur.execute(
                "INSERT INTO allocations (event_name, event_date, parking_lot) VALUES (%s, %s, %s)",
                (row["event"], row["date"], row["parking_lot"]),
            )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


# Define a route to optimize the parking lot allocation
@app.route("/optimize", methods=["POST"])
def optimize_parking():
    try:
        df_events_parking_lot_min_capacity = fetch_data_from_database()
        optimize_and_save_results(df_events_parking_lot_min_capacity)
        return jsonify({"message": "Optimization completed and results saved."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.config["DEBUG"] = True
    app.run()
