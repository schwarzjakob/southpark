import sys
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import logging
import pandas as pd
from datetime import datetime


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


# Dashboard section


@app.route("/available_years", methods=["GET"])
def get_available_years():
    """
    Endpoint to retrieve available years.
    """
    try:
        logger.info("Fetching available years from the database.")
        query_years = """
        SELECT DISTINCT EXTRACT(YEAR FROM date) AS year
        FROM view_schema.demand_vs_capacity
        ORDER BY year;
        """
        result = get_data(query_years)
        years = result["year"].tolist()
        return jsonify({"years": years}), 200
    except Exception as e:
        logger.error("Failed to fetch available years", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/capacity_utilization", methods=["GET"])
def get_capacity_utilization():
    """
    Endpoint to retrieve capacity utilization data.
    Fetches data where visitor demand exceeds or is close to the parking lot capacity.

    Returns:
        JSON response with the fetched data or an error message if an exception is raised.
    """
    try:
        logger.info("Fetching capacity utilization data from the database.")

        # Fetch dates where demand exceeds capacity
        query_exceeds_capacity = """
        SELECT date, total_demand, total_capacity
        FROM view_schema.demand_vs_capacity
        WHERE total_demand > total_capacity
        ORDER BY date;
        """
        exceeds_capacity = get_data(query_exceeds_capacity)

        # Fetch dates where demand is between 80% and 100% of capacity
        query_between_80_and_100 = """
        SELECT date, total_demand, total_capacity
        FROM view_schema.demand_vs_capacity
        WHERE total_demand BETWEEN total_capacity * 0.8 AND total_capacity
        ORDER BY date;
        """
        between_80_and_100 = get_data(query_between_80_and_100)

        year = request.args.get("year", default=datetime.now().year, type=int)
        # Fetch total demands and capacities for each day
        query_total_capacity_utilization = f"""
        SELECT date, total_demand, COALESCE(total_capacity, 1) AS total_capacity
        FROM view_schema.demand_vs_capacity
        WHERE EXTRACT(YEAR FROM date) = {year}
        ORDER BY date;
        """
        total_capacity_utilization = get_data(query_total_capacity_utilization)

        data = {
            "exceeds_capacity": exceeds_capacity.to_dict(orient="records"),
            "between_80_and_100": between_80_and_100.to_dict(orient="records"),
            "total_capacity_utilization": total_capacity_utilization.to_dict(
                orient="records"
            ),
        }

        logger.info("Capacity utilization data fetched successfully.")
        return jsonify(data), 200
    except Exception as e:
        logger.error("Failed to fetch capacity utilization data", exc_info=True)
        return jsonify({"error": str(e)}), 500


# Get events parking lots allocation for front-end table view
@app.route("/events_parking_lots_allocation", methods=["GET"])
def get_events_parking_lots_allocation():
    """
    Endpoint to retrieve parking lot allocations for events.
    Fetches data from the 'view_schema.view_events_parking_lots_allocation' view in the database.

    Returns:
        JSON response with the fetched data or an error message if an exception is raised.
    """
    try:
        logger.info("Fetching events parking lots allocation data from the database.")
        query = "SELECT * FROM view_schema.view_events_parking_lots_allocation;"
        df_events_parking_lots_allocation = get_data(query)
        df_events_parking_lots_allocation['id'] = df_events_parking_lots_allocation.index  # Add unique ID
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
        hall_name = data["hall"]
        entrance = data["entrance"]
        demands = data["demands"]

        # Insert into the event table
        query_event = """
        INSERT INTO event (name, entrance, assembly_start_date, assembly_end_date, runtime_start_date, runtime_end_date, disassembly_start_date, disassembly_end_date)
        VALUES (:name, :entrance, :assembly_start_date, :assembly_end_date, :runtime_start_date, :runtime_end_date, :disassembly_start_date, :disassembly_end_date)
        RETURNING id
        """
        params_event = {
            "name": name,
            "entrance": entrance,
            "assembly_start_date": dates["assembly"]["start"],
            "assembly_end_date": dates["assembly"]["end"],
            "runtime_start_date": dates["runtime"]["start"],
            "runtime_end_date": dates["runtime"]["end"],
            "disassembly_start_date": dates["disassembly"]["start"],
            "disassembly_end_date": dates["disassembly"]["end"],
        }

        with engine.begin() as connection:
            result = connection.execute(text(query_event), params_event)
            event_id = result.fetchone()[0]

            # Insert into the visitor_demand table
            queries = []
            for phase in ["assembly", "runtime", "disassembly"]:
                all_dates = calculate_date_range(
                    dates[phase]["start"], dates[phase]["end"]
                )
                for event_date in all_dates:
                    demand = demands[phase].get(event_date, 0)
                    query_demand = """
                    INSERT INTO visitor_demand (event_id, date, demand, status)
                    VALUES (:event_id, :date, :demand, :status)
                    """
                    params_demand = {
                        "event_id": event_id,
                        "date": event_date,
                        "demand": demand,
                        "status": phase,
                    }
                    queries.append((query_demand, params_demand))

            for query, params in queries:
                connection.execute(text(query), params)

            # Insert into the hall_occupation table
            hall_id_query = "SELECT id FROM hall WHERE name = :hall_name"
            hall_id = connection.execute(
                text(hall_id_query), {"hall_name": hall_name}
            ).fetchone()[0]

            hall_occupation_queries = []
            for phase in ["assembly", "runtime", "disassembly"]:
                all_dates = calculate_date_range(
                    dates[phase]["start"], dates[phase]["end"]
                )
                for event_date in all_dates:
                    query_hall_occupation = """
                    INSERT INTO hall_occupation (event_id, hall_id, date)
                    VALUES (:event_id, :hall_id, :date)
                    """
                    params_hall_occupation = {
                        "event_id": event_id,
                        "hall_id": hall_id,
                        "date": event_date,
                    }
                    hall_occupation_queries.append(
                        (query_hall_occupation, params_hall_occupation)
                    )

            for query, params in hall_occupation_queries:
                connection.execute(text(query), params)

        return jsonify({"message": "Event added successfully"}), 200
    except Exception as e:
        logger.error("Failed to add event", exc_info=True)
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


# Optimize and save results
def optimize_and_save_results(df_events_parking_lot_min_capacity):
    """Optimize the parking lot allocation and save the results to the database."""
    try:
        logger.info("Optimizing parking lot allocation.")
        df_allocation_results = optimize_distance(df_events_parking_lot_min_capacity)
        df_allocation_results.sort_values(by=["event_id", "date"], inplace=True)
        logger.info("Optimization successful. Proceeding to save results.")

        with engine.begin() as connection:
            logger.info("Clearing previous allocations from the database.")
            connection.execute(text("DELETE FROM parking_lot_allocation;"))

            logger.info("Inserting new allocation results into the database.")
            insert_query = text(
                "INSERT INTO parking_lot_allocation (event_id, parking_lot_id, date, allocated_capacity) VALUES (:event_id, :parking_lot_id, :date, :allocated_capacity)"
            )
            for index, row in df_allocation_results.iterrows():
                connection.execute(
                    insert_query,
                    {
                        "event_id": row["event_id"],
                        "parking_lot_id": row["parking_lot_id"],
                        "date": row["date"],
                        "allocated_capacity": row["allocated_capacity"],
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
