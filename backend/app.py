import sys
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import logging
import pandas as pd
from datetime import datetime, timedelta

# Append the directory above 'backend' to the path to access the 'scripts' directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import allocation_algorithm module and its functions
from scripts.allocation_algorithm import optimize_distance

# Load environment variables from .env file
load_dotenv()

# Retrieve the DATABASE_URL from environment variables
database_url = os.getenv("DATABASE_URL")
engine = create_engine(database_url)

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
def get_data(query):
    """Fetch data from the database using the provided SQL query."""
    try:
        logger.info(f"Executing query: {query}")
        with engine.connect() as connection:
            result = pd.read_sql_query(query, connection)
        logger.info("Query executed successfully.")
        return result
    except Exception as e:
        logger.error(f"Failed to execute query: {query}", exc_info=True)
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
    try:
        logger.info("Fetching events parking lots allocation data from the database.")
        query = "SELECT * FROM view_schema.view_events_parking_lots_allocation;"
        df_events_parking_lots_allocation = get_data(query)
        if df_events_parking_lots_allocation.empty:
            logger.info("No data available.")
            return jsonify({"message": "No data found"}), 204
        logger.info("Events parking lots allocation data fetched successfully.")
        return jsonify(df_events_parking_lots_allocation.to_dict(orient="records")), 200
    except Exception as e:
        logger.error("Failed to fetch data from database", exc_info=True)
        return jsonify({"error": str(e)}), 500


def calculate_date_range(start_date, end_date):
    """Calculate the date range between the start and end dates of an events phase."""
    current_date = pd.to_datetime(start_date)
    end = pd.to_datetime(end_date)
    date_array = []
    while current_date <= end:
        date_array.append(current_date.strftime("%Y-%m-%d"))
        current_date += pd.DateOffset(days=1)
    return date_array


@app.route("/add_event", methods=["POST"])
def add_event():
    """
    Endpoint to add a new event to the database.
    """
    try:
        data = request.json
        name = data["name"]
        dates = data["dates"]
        hall = data["hall"]
        entrance = data["entrance"]
        demands = data["demands"]

        # Prepare the queries and parameters for each phase
        queries = []
        phases = ["assembly", "runtime", "disassembly"]
        statuses = ["aufbau", "laufzeit", "abbau"]

        for phase, status in zip(phases, statuses):
            start_date = dates[phase]["start"]
            end_date = dates[phase]["end"]
            all_dates = calculate_date_range(start_date, end_date)

            for event_date in all_dates:
                demand = demands[phase].get(event_date, 0)
                query = """
                INSERT INTO events (name, event_date, status, demand, hall, entrance)
                VALUES (:name, :event_date, :status, :demand, :hall, :entrance)
                """
                params = {
                    "name": name,
                    "event_date": event_date,
                    "status": status,
                    "demand": demand,
                    "hall": hall,
                    "entrance": entrance,
                }
                queries.append((query, params))

        # Execute the queries
        with engine.begin() as connection:
            for query, params in queries:
                connection.execute(text(query), params)

        return jsonify({"message": "Event added successfully"}), 200
    except Exception as e:
        logger.error("Failed to add event", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/events_map/<date>", methods=["GET"])
def get_events_map(date):
    """
    Endpoint to retrieve event data for the map component.

    Parameters:
        date (str): The date around which to fetch the data. Expected format is 'YYYY-MM-DD'.

    Returns:
        JSON response with the fetched data or an error message if an exception is raised.
    """
    try:
        # Convert the date string to a datetime object
        date = datetime.strptime(date, "%Y-%m-%d")

        logger.info("Fetching events timeline data from the database.")
        query = f"""
        SELECT
    ho.date AS occupation_date,
    e.name AS event_name,
    e.entrance AS event_entrance,
    h.name AS hall_name,
    pl.name AS parking_lot_name,
    CASE
        WHEN ho.date BETWEEN e.assembly_start_date AND e.assembly_end_date THEN 'assembly'
        WHEN ho.date BETWEEN e.runtime_start_date AND e.runtime_end_date THEN 'runtime'
        WHEN ho.date BETWEEN e.disassembly_start_date AND e.disassembly_end_date THEN 'disassembly'
        ELSE 'unknown'
    END AS status
FROM
    public.parking_lot_allocation pa
JOIN
    public.event e ON e.id = pa.event_id
JOIN
    public.parking_lot pl ON pl.id = pa.parking_lot_id
JOIN
    public.hall_occupation ho ON ho.date = pa.date
JOIN
    public.hall h ON h.id = ho.hall_id
WHERE
    ho.date = '{date}'
ORDER BY
    ho.date, e.name, h.name, pl.name;"""

        df_events_timeline = get_data(query)
        if df_events_timeline.empty:
            logger.info("No data available.")
            return jsonify({"message": "No data found"}), 204
        logger.info("Events timeline data fetched successfully.")
        return jsonify(df_events_timeline.to_dict(orient="records")), 200
    except Exception as e:
        logger.error("Failed to fetch data from database", exc_info=True)
        return jsonify({"error": str(e)}), 500


# Allocation Algorithm
def get_events_parking_lots_min_capacity():
    """Fetch events parking lot data with minimum capacity for the optimization."""
    try:
        logger.info("Fetching data from the database for optimization.")
        query = "SELECT * FROM view_schema.view_events_parking_lot_min_capacity;"
        return get_data(query)
    except Exception as e:
        logger.error("Failed to fetch optimization data", exc_info=True)
        raise e


def optimize_and_save_results(df_events_parking_lot_min_capacity):
    """Optimize the parking lot allocation and save the results to the database."""
    try:
        logger.info("Optimizing parking lot allocation.")
        df_allocation_results = optimize_distance(df_events_parking_lot_min_capacity)
        df_allocation_results.sort_values(by=["event_id", "date"], inplace=True)
        logger.info("Optimization successful. Proceeding to save results.")

        with engine.begin() as connection:
            logger.info("Clearing previous allocations from the database.")
            connection.execute(text("DELETE FROM allocations;"))

            logger.info("Inserting new allocation results into the database.")
            insert_query = text(
                "INSERT INTO allocations (event_id, event_name, event_date, parking_lot) VALUES (:event_id, :event_name, :event_date, :parking_lot)"
            )
            for index, row in df_allocation_results.iterrows():
                connection.execute(
                    insert_query,
                    {
                        "event_id": row["event_id"],
                        "event_name": row["event_name"],
                        "event_date": row["date"],
                        "parking_lot": row["parking_lot"],
                    },
                )
            logger.info("New allocations successfully saved.")
    except Exception as e:
        logger.error(
            "Failed to optimize and save parking lot allocation results", exc_info=True
        )
        raise e


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
        df_events_parking_lot_min_capacity = get_events_parking_lots_min_capacity()
        if df_events_parking_lot_min_capacity.empty:
            logger.info("No data available for optimization.")
            return jsonify({"message": "No data available to optimize."}), 204

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
