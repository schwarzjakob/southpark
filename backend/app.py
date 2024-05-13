import sys
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import psycopg2
import logging
import pandas as pd

# Append the directory above 'backend' to the path to access the 'scripts' directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import allocation_algorithm module and its functions
from scripts.allocation_algorithm import optimize_distance

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

# Initialize the Flask app
app = Flask(__name__)
CORS(app)


# Database connection
def get_db_connection():
    """Connect to the database and return the connection"""
    try:
        logger.info("Attempting to connect to the database.")
        conn = psycopg2.connect(database_url)
        logger.info("Database connection successfully established.")
        return conn
    except Exception as e:
        logger.error("Failed to connect to the database", exc_info=True)
        raise e


# Get events parking lots allocation for front-end table view
@app.route("/events_parking_lots_allocation", methods=["GET"])
def get_events_parking_lots_allocation():
    """
    Endpoint to retrieve parking lot allocations for events.
    Fetches data from the 'view_schema.view_events_parking_lots_allocations' view in the database.

    Returns:
        JSON response with the fetched data or an error message if an exception is raised.
    """
    conn = get_db_connection()
    try:
        logger.info("Fetching events parking lots allocation data from the database.")
        query = """
        SELECT *
        FROM view_schema.view_events_parking_lots_allocation;
        """
        df_events_parking_lots_allocation = pd.read_sql_query(query, conn)
        logger.info("Events parking lots allocation data fetched successfully.")
        return jsonify(df_events_parking_lots_allocation.to_dict(orient="records")), 200
    except Exception as e:
        logger.error("Failed to fetch data from database", exc_info=True)
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# Allocation Algorithm
def fetch_data_from_database():
    """Fetch distances between halls and parking lots suitable for given events from the database and return as df_events_parking_lot_min_capacity to trigger the allocation algorithm with it."""
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    try:
        logger.info("Fetching data from the database.")
        query = """
        SELECT *
        FROM view_schema.view_events_parking_lot_min_capacity;
        """
        df_events_parking_lot_min_capacity = pd.read_sql_query(query, conn)
        return df_events_parking_lot_min_capacity
    finally:
        conn.close()


def optimize_and_save_results(df_events_parking_lot_min_capacity):
    """Optimize the parking lot allocation and save the results to the database."""
    # Establish database connection
    try:
        logger.info("Connecting to the database for optimization.")
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    except Exception as e:
        logger.error("Failed to connect to the database", exc_info=True)
        raise e

    # Optimize parking lot allocation
    try:
        logger.info("Optimizing parking lot allocation.")
        df_allocation_results = optimize_distance(df_events_parking_lot_min_capacity)
        df_allocation_results.sort_values(by=["event_id", "date"], inplace=True)
        logger.info(
            "Optimization successful. Results: \n{}".format(
                df_allocation_results.head()
            )
        )
    except Exception as e:
        logger.error("Failed to optimize parking lot allocation", exc_info=True)
        raise e

    # Save results to the database
    try:
        with conn.cursor() as cur:
            logger.info("Clearing previous allocations from the database.")
            cur.execute("DELETE FROM allocations;")

            logger.info("Inserting new allocation results into the database.")
            for index, row in df_allocation_results.iterrows():
                cur.execute(
                    "INSERT INTO allocations (event_id, event_name, event_date, parking_lot) VALUES (%s, %s, %s, %s)",
                    (
                        row["event_id"],
                        row["event_name"],
                        row["date"],
                        row["parking_lot"],
                    ),
                )
            conn.commit()
            logger.info("New allocations successfully saved.")
    except Exception as e:
        conn.rollback()
        logger.error(
            "Failed to insert allocation results into the database", exc_info=True
        )
        raise e
    finally:
        conn.close()
        logger.info("Database connection closed.")

# Optimize parking lot allocation
@app.route("/optimize_distance", methods=["POST"])
def optimize_parking():
    """
    Endpoint to optimize the parking lot allocation. It fetches data from the database,
    optimizes the allocation, and saves the results back to the database.

    Returns:
        JSON response with a success message if the optimization is completed successfully,
        or an error message if an exception is raised.
    """
    logger.info("Received request to optimize parking allocations.")
    try:
        logger.info("Fetching data from database for optimization.")
        df_events_parking_lot_min_capacity = fetch_data_from_database()
        if df_events_parking_lot_min_capacity.empty:
            logger.info("No data available for optimization.")
            return jsonify({"message": "No data available to optimize."}), 200

        logger.info("Data fetched successfully, proceeding to optimization.")
        optimize_and_save_results(df_events_parking_lot_min_capacity)
        logger.info("Optimization and saving of results completed successfully.")
        return jsonify({"message": "Optimization completed and results saved."}), 200
    except Exception as e:
        logger.error("Error during optimization process", exc_info=True)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.config["DEBUG"] = True
    app.run()
