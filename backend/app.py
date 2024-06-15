import csv
import logging
import os
import sys
from datetime import datetime, timedelta
from io import StringIO

import pandas as pd
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import create_engine, text

# Initialize the Flask app
app = Flask(__name__)
CORS(app)

# Append the directory above 'backend' to the path to access the 'scripts' directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import allocation_algorithm module and its functions
from scripts.allocation_algorithm import fetch_and_optimize_parking_lots

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


# Fetch all events
@app.route("/events", methods=["GET"])
def get_events():
    """
    Endpoint to retrieve all events with their demands.
    """
    try:
        logger.info("Fetching all events from the database.")
        query_events = "SELECT * FROM event ORDER BY runtime_start_date"
        query_demands = "SELECT event_id, date, demand, status FROM visitor_demand"
        query_halls = """
        SELECT ho.event_id, h.name as hall_name
        FROM hall_occupation ho
        JOIN hall h ON ho.hall_id = h.id
        """

        events = get_data(query_events).to_dict(orient="records")
        demands = get_data(query_demands).to_dict(orient="records")
        halls = get_data(query_halls).to_dict(orient="records")

        event_map = {event["id"]: event for event in events}
        for demand in demands:
            event_id = demand["event_id"]
            date_str = demand["date"].strftime("%Y-%m-%d")
            if "demands" not in event_map[event_id]:
                event_map[event_id]["demands"] = {
                    "assembly": {},
                    "runtime": {},
                    "disassembly": {},
                }
            event_map[event_id]["demands"][demand["status"]][date_str] = demand[
                "demand"
            ]

        for hall in halls:
            event_id = hall["event_id"]
            if "halls" not in event_map[event_id]:
                event_map[event_id]["halls"] = []
            event_map[event_id]["halls"].append(hall["hall_name"])

        print(event_map.values())
        return jsonify(list(event_map.values())), 200
    except Exception as e:
        logger.error("Failed to fetch events", exc_info=True)
        return jsonify({"error": str(e)}), 500


def parse_date(date_str):
    """
    Parse date string in different formats.
    """
    formats = ["%Y-%m-%d", "%a, %d %b %Y %H:%M:%S %Z"]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Date {date_str} is not in a recognized format.")


# Update an event
@app.route("/events/<int:id>", methods=["PUT"])
def update_event(id):
    """
    Endpoint to update an existing event.
    """
    try:
        data = request.json

        # def parse_date(date_str):
        #     formats = ["%Y-%m-%d", "%a, %d %b %Y %H:%M:%S %Z"]
        #     for fmt in formats:
        #         try:
        #             return datetime.strptime(date_str, fmt).date()
        #         except ValueError:
        #             continue
        #     raise ValueError(f"Date {date_str} is not in a recognized format.")

        event_query = """
        UPDATE event
        SET name = :name,
            entrance = :entrance,
            assembly_start_date = :assembly_start_date,
            assembly_end_date = :assembly_end_date,
            runtime_start_date = :runtime_start_date,
            runtime_end_date = :runtime_end_date,
            disassembly_start_date = :disassembly_start_date,
            disassembly_end_date = :disassembly_end_date
        WHERE id = :id
        """
        event_params = {
            "id": id,
            "name": data["name"],
            "entrance": data["entrance"],
            "assembly_start_date": parse_date(data["dates"]["assembly"]["start"]),
            "assembly_end_date": parse_date(data["dates"]["assembly"]["end"]),
            "runtime_start_date": parse_date(data["dates"]["runtime"]["start"]),
            "runtime_end_date": parse_date(data["dates"]["runtime"]["end"]),
            "disassembly_start_date": parse_date(data["dates"]["disassembly"]["start"]),
            "disassembly_end_date": parse_date(data["dates"]["disassembly"]["end"]),
        }

        with engine.begin() as connection:
            connection.execute(text(event_query), event_params)

            # Delete previous hall occupations for the given event
            connection.execute(
                text("DELETE FROM hall_occupation WHERE event_id = :event_id"),
                {"event_id": id},
            )

            # Insert new hall occupations
            for hall in data["halls"]:
                hall_id_query = "SELECT id FROM hall WHERE name = :hall_name"
                hall_id = connection.execute(
                    text(hall_id_query), {"hall_name": hall}
                ).fetchone()[0]

                for phase, phase_dates in data["dates"].items():
                    start_date = parse_date(phase_dates["start"])
                    end_date = parse_date(phase_dates["end"])
                    current_date = start_date
                    while current_date <= end_date:
                        connection.execute(
                            text(
                                """
                                INSERT INTO hall_occupation (event_id, hall_id, date)
                                VALUES (:event_id, :hall_id, :date)
                            """
                            ),
                            {"event_id": id, "hall_id": hall_id, "date": current_date},
                        )
                        current_date += timedelta(days=1)

            # Update demands
            connection.execute(
                text("DELETE FROM visitor_demand WHERE event_id = :event_id"),
                {"event_id": id},
            )
            for phase, demands in data["demands"].items():
                for date, demand in demands.items():
                    connection.execute(
                        text(
                            """
                            INSERT INTO visitor_demand (event_id, date, demand, status)
                            VALUES (:event_id, :date, :demand, :status)
                        """
                        ),
                        {
                            "event_id": id,
                            "date": parse_date(date),
                            "demand": demand,
                            "status": phase,
                        },
                    )

        return jsonify({"message": "Event updated successfully"}), 200
    except Exception as e:
        logger.error("Failed to update event", exc_info=True)
        return jsonify({"error": str(e)}), 500



@app.route("/events_timeline/<date>", methods=["GET"])
def get_events_timeline(date):
    """
    Endpoint to retrieve event data for both the timeline and map component.
    Fetches data from the 'view_schema.view_events_timeline' view in the database.

    Parameters:
        date (str): The date around which to fetch the data. Expected format is 'YYYY-MM-DD'.

    Returns:
        JSON response with the fetched data or an error message if an exception is raised.
    """
    try:
        # Convert the date string to a datetime object
        date = datetime.strptime(date, "%Y-%m-%d")

        # Calculate the start and end dates for the filter
        start_date = date - timedelta(days=45)
        end_date = date + timedelta(days=45)

        logger.info("Fetching events timeline data from the database.")
        query = f"""
        SELECT * FROM view_schema.view_events_timeline
        WHERE
            (disassembly_end_date >= '{start_date}' AND assembly_start_date <= '{end_date}')
        """
        df_events_timeline = get_data(query)
        if df_events_timeline.empty:
            logger.info("No data available.")
            return jsonify({"message": "No data found"}), 204
        logger.info("Events timeline data fetched successfully.")
        return jsonify(df_events_timeline.to_dict(orient="records")), 200
    except Exception as e:
        logger.error("Failed to fetch data from database", exc_info=True)
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

        year = request.args.get("year", default=datetime.now().year, type=int)
        month = request.args.get("month", default=datetime.now().month, type=int)

        query_total_capacity_utilization = f"""
        SELECT date, total_demand, COALESCE(total_capacity, 1) AS total_capacity
        FROM view_schema.view_demand_vs_capacity
        ORDER BY date;
        """
        total_capacity_utilization = get_data(query_total_capacity_utilization)

        # Fetch events for each day and their capacities and names
        query_events_per_day = f"""
        SELECT vd.date, vd.event_id, vd.demand AS capacity, e.name AS event_name
        FROM public.visitor_demand vd
        JOIN public.event e ON vd.event_id = e.id
        ORDER BY vd.date, vd.event_id;
        """
        events_per_day = get_data(query_events_per_day)
        events_dict = {}
        for _, row in events_per_day.iterrows():
            date = row['date'].strftime("%Y-%m-%d")
            if date not in events_dict:
                events_dict[date] = {}
            if row['event_id'] not in events_dict[date]:
                events_dict[date][row['event_id']] = {
                    "event_id": row["event_id"],
                    "event_name": row["event_name"],
                    "capacity": 0
                }
            events_dict[date][row['event_id']]["capacity"] += row["capacity"]

        data = []
        for _, row in total_capacity_utilization.iterrows():
            date_str = row['date'].strftime("%Y-%m-%d")
            data.append({
                "date": date_str,
                "total_demand": row["total_demand"],
                "total_capacity": row["total_capacity"],
                "events": list(events_dict.get(date_str, {}).values())
            })

        logger.info("Capacity utilization data fetched successfully.")
        return jsonify(data), 200
    except Exception as e:
        logger.error("Failed to fetch capacity utilization data", exc_info=True)
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


# Check hall availability
@app.route("/check_hall_availability", methods=["POST"])
def check_hall_availability():
    """
    Endpoint to check hall availability for the given event dates.
    """
    try:
        data = request.json
        event_id = data.get("event_id", None)
        selected_halls = data["halls"]
        dates = data["dates"]

        all_dates = []
        for phase in ["assembly", "runtime", "disassembly"]:
            all_dates += calculate_date_range(
                dates[phase]["start"], dates[phase]["end"]
            )

        hall_id_query = "SELECT id, name FROM hall"
        hall_occupation_query = """
        SELECT ho.event_id, ho.hall_id, ho.date, e.name as event_name
        FROM hall_occupation ho
        JOIN event e ON ho.event_id = e.id
        WHERE ho.date IN :dates
        AND (ho.event_id != :event_id OR :event_id IS NULL)
        """

        occupied_halls = {}
        free_halls_by_date = {date: set() for date in all_dates}

        with engine.connect() as connection:
            hall_ids = connection.execute(text(hall_id_query)).fetchall()
            hall_map = {hall[0]: hall[1] for hall in hall_ids}
            all_halls = set(hall_map.values())

            result = connection.execute(
                text(hall_occupation_query),
                {
                    "dates": tuple(all_dates),
                    "event_id": event_id,
                },
            ).fetchall()

            for row in result:
                hall_name = hall_map[row[1]]
                date_str = row[2].strftime("%Y-%m-%d")
                if hall_name not in occupied_halls:
                    occupied_halls[hall_name] = []
                occupied_halls[hall_name].append(
                    {
                        "event_id": row[0],
                        "date": row[2].strftime("%d.%m.%Y"),
                        "event_name": row[3],
                    }
                )
                free_halls_by_date[date_str].discard(hall_name)

        # Calculate free halls correctly
        for date in all_dates:
            free_halls_by_date[date] = sorted(
                all_halls
                - set(
                    hall_map[hall_id]
                    for hall_id, hall_name in hall_ids
                    if hall_name in occupied_halls
                )
            )

        # Filter occupied_halls to only include selected halls
        selected_occupied_halls = {
            hall: occupied_halls[hall]
            for hall in selected_halls
            if hall in occupied_halls
        }

        print(selected_occupied_halls)
        print(free_halls_by_date)
        return (
            jsonify(
                {
                    "occupied_halls": selected_occupied_halls,
                    "free_halls": free_halls_by_date,
                }
            ),
            200,
        )
    except Exception as e:
        logger.error("Failed to check hall availability", exc_info=True)
        return jsonify({"error": str(e)}), 500


# Add event form
@app.route("/add_event", methods=["POST"])
def add_event():
    """
    Endpoint to add a new event to the database.
    """
    try:
        data = request.json
        name = data["name"]
        dates = data["dates"]
        halls = data["halls"]
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

            # Insert into the hall_occupation table for each selected hall
            hall_id_query = "SELECT id FROM hall WHERE name = :hall_name"
            hall_occupation_queries = []
            for hall_name in halls:
                hall_id = connection.execute(
                    text(hall_id_query), {"hall_name": hall_name}
                ).fetchone()[0]

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


# Import events
@app.route("/import_events", methods=["POST"])
def import_events():
    try:
        data = request.json
        csv_data = data.get("csv_data")
        # mapping = data.get("mapping")
        mapping = {
            "name": "name",
            "halls": "halls",
            "assembly_start_date": "assembly_start_date",
            "assembly_end_date": "assembly_end_date",
            "runtime_start_date": "runtime_start_date",
            "runtime_end_date": "runtime_end_date",
            "disassembly_start_date": "disassembly_start_date",
            "disassembly_end_date": "disassembly_end_date",
            "entrance": "entrance",
        }

        logger.debug(f"Received mapping: {mapping}")
        logger.debug(f"Received CSV data: {csv_data}")

        if not csv_data or not mapping:
            return jsonify({"error": "Invalid input data"}), 400

        # Validate required fields in the mapping
        required_fields = [
            "name",
            "assembly_start_date",
            "assembly_end_date",
            "runtime_start_date",
            "runtime_end_date",
            "disassembly_start_date",
            "disassembly_end_date",
            "entrance",
            "halls",
        ]

        # Check if required fields are present in the mapping
        missing_fields = [field for field in required_fields if field not in mapping]
        if missing_fields:
            logger.error(f"Missing required fields in mapping: {missing_fields}")
            return (
                jsonify(
                    {"error": f"Missing required fields in mapping: {missing_fields}"}
                ),
                400,
            )

        events = []
        for row in csv_data:
            logger.debug(f"Processing row: {row}")
            try:
                event = {
                    "name": row.get(mapping["name"], "").strip(),
                    "assembly_start_date": row.get(
                        mapping["assembly_start_date"], ""
                    ).strip(),
                    "assembly_end_date": row.get(
                        mapping["assembly_end_date"], ""
                    ).strip(),
                    "runtime_start_date": row.get(
                        mapping["runtime_start_date"], ""
                    ).strip(),
                    "runtime_end_date": row.get(
                        mapping["runtime_end_date"], ""
                    ).strip(),
                    "disassembly_start_date": row.get(
                        mapping["disassembly_start_date"], ""
                    ).strip(),
                    "disassembly_end_date": row.get(
                        mapping["disassembly_end_date"], ""
                    ).strip(),
                    "entrance": row.get(mapping["entrance"], "").strip(),
                    "halls": [
                        hall.strip()
                        for hall in row.get(mapping["halls"], "").split(",")
                    ],
                }

                # Check for missing required fields in each row
                for key, value in event.items():
                    if not value and key != "halls":
                        logger.error(f"Missing field in row: '{key}'")
                        raise KeyError(f"Missing field in row: '{key}'")

                events.append(event)
            except KeyError as e:
                logger.error(f"Missing field in row: {e}")
                continue

        # Insert events into the database
        with engine.begin() as connection:
            for event in events:
                query_event = """
                INSERT INTO event (name, entrance, assembly_start_date, assembly_end_date, runtime_start_date, runtime_end_date, disassembly_start_date, disassembly_end_date)
                VALUES (:name, :entrance, :assembly_start_date, :assembly_end_date, :runtime_start_date, :runtime_end_date, :disassembly_start_date, :disassembly_end_date)
                RETURNING id
                """
                params_event = {
                    "name": event["name"],
                    "entrance": event["entrance"],
                    "assembly_start_date": event["assembly_start_date"],
                    "assembly_end_date": event["assembly_end_date"],
                    "runtime_start_date": event["runtime_start_date"],
                    "runtime_end_date": event["runtime_end_date"],
                    "disassembly_start_date": event["disassembly_start_date"],
                    "disassembly_end_date": event["disassembly_end_date"],
                }
                result = connection.execute(text(query_event), params_event)
                event_id = result.fetchone()[0]

                # Insert visitor demands
                for phase in ["assembly", "runtime", "disassembly"]:
                    all_dates = calculate_date_range(
                        event[f"{phase}_start_date"], event[f"{phase}_end_date"]
                    )
                    for event_date in all_dates:
                        query_demand = """
                        INSERT INTO visitor_demand (event_id, date, demand, status)
                        VALUES (:event_id, :date, :demand, :status)
                        """
                        params_demand = {
                            "event_id": event_id,
                            "date": event_date,
                            "demand": 0,  # Set default demand to 0, can be updated later
                            "status": phase,
                        }
                        connection.execute(text(query_demand), params_demand)

                # Insert hall occupations
                hall_id_query = "SELECT id FROM hall WHERE name = :hall_name"
                for hall_name in event["halls"]:
                    hall_id = connection.execute(
                        text(hall_id_query), {"hall_name": hall_name}
                    ).fetchone()[0]
                    for phase in ["assembly", "runtime", "disassembly"]:
                        all_dates = calculate_date_range(
                            event[f"{phase}_start_date"], event[f"{phase}_end_date"]
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
                            connection.execute(
                                text(query_hall_occupation), params_hall_occupation
                            )

        return jsonify({"message": "Events imported successfully"}), 200
    except Exception as e:
        logger.error("Failed to import events", exc_info=True)
        return jsonify({"error": str(e)}), 500


# Fetch events without demands
@app.route("/events_without_valid_demands", methods=["GET"])
def events_without_valid_demands():
    try:
        query = """
        SELECT e.id as event_id, e.name, e.assembly_start_date, e.assembly_end_date, 
               e.runtime_start_date, e.runtime_end_date, e.disassembly_start_date, 
               e.disassembly_end_date, vd.id as demand_id, vd.date, vd.demand, vd.status
        FROM event e
        LEFT JOIN visitor_demand vd ON e.id = vd.event_id
        WHERE vd.demand = 0
        """
        events = get_data(query).to_dict(orient="records")
        logger.info("Events without valid demands fetched successfully.")
        return jsonify({"events": events}), 200
    except Exception as e:
        logger.error("Failed to fetch events without valid demands", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/add_demands/<int:event_id>", methods=["POST"])
def add_demands(event_id):
    try:
        demands = request.json["demands"]
        queries = []

        for demand_id, demand_data in demands.items():
            query_demand = """
            UPDATE visitor_demand
            SET demand = :demand
            WHERE id = :demand_id
            """
            params_demand = {
                "demand_id": demand_id,
                "demand": demand_data["demand"],
            }
            queries.append((query_demand, params_demand))

        with engine.begin() as connection:
            for query, params in queries:
                connection.execute(text(query), params)

        return jsonify({"message": "Demands updated successfully"}), 200
    except Exception as e:
        logger.error("Failed to update demands", exc_info=True)
        return jsonify({"error": str(e)}), 500


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
        logger.info("Fetching and optimizing parking lot allocations.")
        message = fetch_and_optimize_parking_lots(engine)
        logger.info("Optimization and saving of results completed successfully.")
        return jsonify({"message": message}), 200
    except Exception as e:
        logger.error("Error during optimization process", exc_info=True)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.config["DEBUG"] = True
    app.run(host="0.0.0.0", port=5000)
