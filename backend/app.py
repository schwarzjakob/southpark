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
from sqlalchemy.exc import IntegrityError

# Append the directory above 'backend' to the path to access the 'scripts' directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import allocation_algorithm module and its functions
from scripts.allocation_algorithm import fetch_and_optimize_parking_lots

# Load environment variables from .env file
load_dotenv()

# Retrieve the DATABASE_URL from environment variables
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise ValueError("No DATABASE_URL found in environment variables")

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
        FROM view_schema.view_demand_vs_capacity
        ORDER BY year;
        """
        result = get_data(query_years)
        years = result["year"].tolist()
        return jsonify({"years": years}), 200
    except Exception as e:
        logger.error("Failed to fetch available years", exc_info=True)
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
        query = """
        SELECT
            event_id,
            event,
            date,
            demand,
            status,
            STRING_AGG(DISTINCT halls, ', ') AS halls,
            parking_lot,
            allocated_capacity,
            distance
        FROM view_schema.view_events_parking_lots_allocation
        GROUP BY event_id, event, date, demand, status, parking_lot, allocated_capacity, distance
        ORDER BY event_id, date;

        """
        df_events_parking_lots_allocation = get_data(query)
        df_events_parking_lots_allocation["id"] = (
            df_events_parking_lots_allocation.index
        )  # Add unique ID
        if df_events_parking_lots_allocation.empty:
            logger.info("No data available.")
            return jsonify({"message": "No data found"}), 204
        print(df_events_parking_lots_allocation)
        logger.info("Events parking lots allocation data fetched successfully.")
        return jsonify(df_events_parking_lots_allocation.to_dict(orient="records")), 200
    except Exception as e:
        logger.error("Failed to fetch data from database", exc_info=True)
        return jsonify({"error": str(e)}), 500


# Get coordinates of entrances, parking lots, and halls
@app.route("/coordinates", methods=["GET"])
def get_coordinates():
    """
    Endpoint to retrieve coordinates of entrances, parking lots, and halls.

    Returns:
        JSON response with the fetched data or an error message if an exception is raised.
    """
    try:
        logger.info("Fetching coordinates data from the database.")

        # Query to fetch halls data
        query_halls = """
        SELECT id, name, coordinates
        FROM public.hall
        """
        df_halls = get_data(query_halls)
        if df_halls.empty:
            logger.info("No data available for halls.")
            halls_data = []
        else:
            logger.info("Halls data fetched successfully.")
            halls_data = df_halls.to_dict(orient="records")

        # Query to fetch parking lots data
        query_parking_lots = """
        SELECT id, name, coordinates
        FROM public.parking_lot
        """
        df_parking_lots = get_data(query_parking_lots)
        if df_parking_lots.empty:
            logger.info("No data available for parking lots.")
            parking_lots_data = []
        else:
            logger.info("Parking lots data fetched successfully.")
            parking_lots_data = df_parking_lots.to_dict(orient="records")

        # Query to fetch entrances data
        query_entrances = """
        SELECT id, name, coordinates
        FROM public.entrance
        """
        df_entrances = get_data(query_entrances)
        if df_entrances.empty:
            logger.info("No data available for entrances.")
            entrances_data = []
        else:
            logger.info("Entrances data fetched successfully.")
            entrances_data = df_entrances.to_dict(orient="records")

        # Combine all data into a single dictionary
        data = {
            "halls": halls_data,
            "parking_lots": parking_lots_data,
            "entrances": entrances_data,
        }

        logger.info("Coordinates data fetched successfully.")
        return jsonify(data), 200
    except Exception as e:
        logger.error("Failed to fetch data from database", exc_info=True)
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

# get capacity utilization
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
        start_date = request.args.get("start_date", default=f"{year}-01-01", type=str)
        end_date = request.args.get("end_date", default=f"{year}-12-31", type=str)

        query_total_capacity_utilization = f"""
        SELECT date, total_demand, COALESCE(total_capacity, 1) AS total_capacity
        FROM view_schema.view_demand_vs_capacity
        WHERE date BETWEEN '{start_date}' AND '{end_date}'
        ORDER BY date;
        """
        total_capacity_utilization = get_data(query_total_capacity_utilization)

        query_events_per_day = f"""
        SELECT vd.date, vd.event_id, vd.demand AS capacity, e.name AS event_name, e.color AS event_color
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
                    "capacity": 0,
                    "event_color": row["event_color"]
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

# Get capacity utilization for critical days
@app.route("/capacity_utilization_critical_days/<int:year>", methods=["GET"])
def capacity_utilization_critical_days(year):
    """
    Endpoint to retrieve capacity utilization data for a given year.
    Outputs the count and dates of days where capacity utilization is between 80-100%
    and above 100% for each month.
    """
    try:
        start_date = f"{year}-01-01"
        end_date = f"{year}-12-31"

        query = f"""
        SELECT date, total_demand, total_capacity
        FROM view_schema.view_demand_vs_capacity
        WHERE date BETWEEN '{start_date}' AND '{end_date}'
        ORDER BY date;
        """
        data = pd.read_sql_query(query, engine)

        monthly_data = {}

        for _, row in data.iterrows():
            date = pd.to_datetime(row['date'])
            month = date.strftime("%Y-%m")
            day = date.strftime("%d")

            if month not in monthly_data:
                monthly_data[month] = {
                    "above_100": {"count": 0, "dates": []},
                    "between_80_and_100": {"count": 0, "dates": []}
                }

            demand = row["total_demand"]
            capacity = row["total_capacity"]
            if 0.8 * capacity <= demand <= capacity:
                monthly_data[month]["between_80_and_100"]["count"] += 1
                monthly_data[month]["between_80_and_100"]["dates"].append(date.strftime("%Y-%m-%d"))
            elif demand > capacity:
                monthly_data[month]["above_100"]["count"] += 1
                monthly_data[month]["above_100"]["dates"].append(date.strftime("%Y-%m-%d"))

        return jsonify(monthly_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# Fetch total capacity
@app.route("/total_capacity", methods=["GET"])
def total_capacity():
    """
    Endpoint to calculate the available capacities for each day within a specified time range.
    """
    try:
        # Get the start_date and end_date from the query parameters
        start_date_str = request.args.get("start_date")
        end_date_str = request.args.get("end_date")
        
        # Parse the dates
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        
        logger.info(f"Calculating total capacity from {start_date} to {end_date}.")
        
        # SQL query to fetch the required fields
        query = """
        SELECT id, parking_lot_id, capacity, valid_from, valid_to
        FROM public.parking_lot_capacity
        """
        
        # Execute the query and fetch data
        result = get_data(query)
        
        # Convert result to a list of dictionaries
        capacity_data = result.to_dict(orient="records")
        
        # Calculate capacities for each day within the range
        total_capacities = []
        current_date = start_date
        while current_date <= end_date:
            total_capacity = sum(
                entry["capacity"] for entry in capacity_data
                if entry["valid_from"] <= current_date <= entry["valid_to"]
            )
            total_capacities.append({
                "day": current_date.strftime("%Y-%m-%d"),
                "total_capacity": total_capacity
            })
            current_date += timedelta(days=1)
        
        logger.info("Total capacities calculated successfully.")
        return jsonify(total_capacities), 200
    except Exception as e:
        logger.error("Failed to calculate total capacities", exc_info=True)
        return jsonify({"error": str(e)}), 500
    
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
        entrances = data["entrances"]
        demands = data["demands"]

        # Insert into the event table
        query_event = """
        INSERT INTO event (name, assembly_start_date, assembly_end_date, runtime_start_date, runtime_end_date, disassembly_start_date, disassembly_end_date)
        VALUES (:name, :assembly_start_date, :assembly_end_date, :runtime_start_date, :runtime_end_date, :disassembly_start_date, :disassembly_end_date)
        RETURNING id
        """
        params_event = {
            "name": name,
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
                    INSERT INTO visitor_demand (event_id, date, demand, car_demand, truck_demand, bus_demand, status)
                    VALUES (:event_id, :date, :demand, :car_demand, :truck_demand, :bus_demand, :status)
                    """
                    params_demand = {
                        "event_id": event_id,
                        "date": event_date,
                        "demand": demand,
                        "car_demand": demands[phase].get("car", 0),
                        "truck_demand": demands[phase].get("truck", 0),
                        "bus_demand": demands[phase].get("bus", 0),
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

            # Insert into the entrance_occupation table for each selected entrance
            entrance_id_query = "SELECT id FROM entrance WHERE name = :entrance_name"
            entrance_occupation_queries = []
            for entrance_name in entrances:
                entrance_id_result = connection.execute(
                    text(entrance_id_query), {"entrance_name": entrance_name}
                ).fetchone()

                if entrance_id_result:
                    entrance_id = entrance_id_result[0]

                    for phase in ["assembly", "runtime", "disassembly"]:
                        all_dates = calculate_date_range(
                            dates[phase]["start"], dates[phase]["end"]
                        )
                        for event_date in all_dates:
                            query_entrance_occupation = """
                            INSERT INTO entrance_occupation (event_id, entrance_id, date)
                            VALUES (:event_id, :entrance_id, :date)
                            """
                            params_entrance_occupation = {
                                "event_id": event_id,
                                "entrance_id": entrance_id,
                                "date": event_date,
                            }
                            entrance_occupation_queries.append(
                                (query_entrance_occupation, params_entrance_occupation)
                            )

            for query, params in entrance_occupation_queries:
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

# Fetch parking spaces
@app.route("/get_parking_spaces", methods=["GET"])
def get_parking_spaces():
    """
    Endpoint to retrieve all parking spaces.
    """
    try:
        logger.info("Fetching all parking spaces from the database.")
        query = """
        SELECT id, name, service_toilets, surface_material, service_shelter, pricing, external
        FROM public.parking_lot
        """
        parking_spaces = get_data(query).to_dict(orient="records")
        logger.info("Parking spaces fetched successfully.")
        return jsonify(parking_spaces), 200
    except Exception as e:
        logger.error("Failed to fetch parking spaces", exc_info=True)
        return jsonify({"error": str(e)}), 500


# Add parking space
@app.route("/add_parking_space", methods=["POST"])
def add_parking_space():
    """
    Endpoint to add a new parking space.
    """
    try:
        data = request.json
        name = data.get("name")
        service_toilets = data.get("service_toilets", False)
        surface_material = data.get("surface_material")
        service_shelter = data.get("service_shelter", False)
        pricing = data.get("pricing")
        external = data.get("external", False)
        coordinates = [0, 0]  # Always set coordinates to [0, 0]

        with engine.begin() as connection:
            # Fetch the maximum existing ID
            max_id_result = connection.execute(text("SELECT MAX(id) FROM public.parking_lot"))
            max_id = max_id_result.scalar() or 0
            new_id = max_id + 1

            query = """
            INSERT INTO public.parking_lot (id, name, service_toilets, surface_material, service_shelter, pricing, external, coordinates)
            VALUES (:id, :name, :service_toilets, :surface_material, :service_shelter, :pricing, :external, :coordinates)
            RETURNING id
            """
            params = {
                "id": new_id,
                "name": name,
                "service_toilets": service_toilets,
                "surface_material": surface_material,
                "service_shelter": service_shelter,
                "pricing": pricing,
                "external": external,
                "coordinates": coordinates,
            }

            result = connection.execute(text(query), params)
            parking_lot_id = result.fetchone()[0]

        return jsonify({"message": "Parking space added successfully", "id": parking_lot_id}), 201
    except IntegrityError as e:
        if 'unique constraint' in str(e.orig):
            logger.error("Failed to add parking space: duplicate name", exc_info=True)
            return jsonify({"error": "Parking space with this name already exists."}), 400
        else:
            logger.error("Failed to add parking space: integrity error", exc_info=True)
            return jsonify({"error": "Integrity error occurred."}), 400
    except Exception as e:
        logger.error("Failed to add parking space", exc_info=True)
        return jsonify({"error": str(e)}), 500
    
# Fetch parking space by ID
@app.route("/get_parking_space/<int:id>", methods=["GET"])
def get_parking_space(id):
    """
    Endpoint to get a parking space by ID.
    """
    try:
        with engine.begin() as connection:
            query = """
            SELECT id, name, service_toilets, surface_material, service_shelter, pricing, external, coordinates
            FROM public.parking_lot
            WHERE id = :id
            """
            result = connection.execute(text(query), {"id": id})
            parking_space = result.fetchone()
            
            if parking_space is None:
                logger.info(f"Parking space with ID {id} not found.")
                return jsonify({"error": "Parking space not found."}), 404
            
            # Convert SQLAlchemy result to a dictionary
            parking_space_dict = {
                "id": parking_space[0],
                "name": parking_space[1],
                "service_toilets": parking_space[2],
                "surface_material": parking_space[3],
                "service_shelter": parking_space[4],
                "pricing": parking_space[5],
                "external": parking_space[6],
                "coordinates": parking_space[7]
            }

            return jsonify(parking_space_dict), 200
    except Exception as e:
        logger.error(f"Failed to fetch parking space with ID {id}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# Edit parking space
@app.route("/edit_parking_space/<int:id>", methods=["PUT"])
def edit_parking_space(id):
    """
    Endpoint to edit an existing parking space.
    """
    try:
        data = request.json
        name = data.get("name")
        service_toilets = data.get("service_toilets", False)
        surface_material = data.get("surface_material")
        service_shelter = data.get("service_shelter", False)
        pricing = data.get("pricing")
        external = data.get("external", False)
        coordinates = data.get("coordinates")

        with engine.begin() as connection:
            query = """
            UPDATE public.parking_lot
            SET name = :name,
                service_toilets = :service_toilets,
                surface_material = :surface_material,
                service_shelter = :service_shelter,
                pricing = :pricing,
                external = :external,
                coordinates = :coordinates
            WHERE id = :id
            RETURNING id
            """
            params = {
                "id": id,
                "name": name,
                "service_toilets": service_toilets,
                "surface_material": surface_material,
                "service_shelter": service_shelter,
                "pricing": pricing,
                "external": external,
                "coordinates": coordinates,
            }

            result = connection.execute(text(query), params)
            parking_lot_id = result.fetchone()[0]

        return jsonify({"message": "Parking space updated successfully", "id": parking_lot_id}), 200
    except IntegrityError as e:
        if 'unique constraint' in str(e.orig):
            logger.error("Failed to update parking space: duplicate name", exc_info=True)
            return jsonify({"error": "Parking space with this name already exists."}), 400
        else:
            logger.error("Failed to update parking space: integrity error", exc_info=True)
            return jsonify({"error": "Integrity error occurred."}), 400
    except Exception as e:
        logger.error(f"Failed to update parking space with ID {id}: {e}", exc_info=True)
        return jsonify({"error": f"Failed to update parking space with ID {id}: {str(e)}"}), 500

# Fetch parking space capacities by parking lot ID
@app.route("/get_parking_space_capacities/<int:parking_lot_id>", methods=["GET"])
def get_parking_space_capacities(parking_lot_id):
    """
    Endpoint to retrieve all capacity entries for a given parking lot ID.
    """
    try:
        logger.info(f"Fetching capacities for parking lot ID: {parking_lot_id}")
        query = """
        SELECT id, parking_lot_id, capacity, utilization_type, truck_limit, bus_limit, valid_from, valid_to
        FROM public.parking_lot_capacity
        WHERE parking_lot_id = :parking_lot_id
        """
        params = {"parking_lot_id": parking_lot_id}
        capacities = get_data(text(query).params(**params)).to_dict(orient="records")

        if not capacities:
            logger.info(f"No capacities found for parking lot ID: {parking_lot_id}")
            return jsonify({"message": "No capacities found"}), 204

        logger.info("Capacities fetched successfully.")
        return jsonify(capacities), 200
    except Exception as e:
        logger.error("Failed to fetch capacities", exc_info=True)
        return jsonify({"error": str(e)}), 500

# Add parking space capacity
@app.route("/add_parking_space_capacities", methods=["POST"])
def add_parking_space_capacities():
    """
    Endpoint to add a new parking space capacity.
    """
    try:
        data = request.json
        parking_lot_id = data.get("parking_lot_id")
        capacity = data.get("capacity")
        utilization_type = data.get("utilization_type")
        truck_limit = data.get("truck_limit")
        bus_limit = data.get("bus_limit")
        valid_from = data.get("valid_from")
        valid_to = data.get("valid_to")

        if not (parking_lot_id and capacity and utilization_type and truck_limit and bus_limit and valid_from and valid_to):
            return jsonify({"error": "All fields are required"}), 400

        query = """
        INSERT INTO public.parking_lot_capacity (parking_lot_id, capacity, utilization_type, truck_limit, bus_limit, valid_from, valid_to)
        VALUES (:parking_lot_id, :capacity, :utilization_type, :truck_limit, :bus_limit, :valid_from, :valid_to)
        RETURNING id
        """
        params = {
            "parking_lot_id": parking_lot_id,
            "capacity": capacity,
            "utilization_type": utilization_type,
            "truck_limit": truck_limit,
            "bus_limit": bus_limit,
            "valid_from": valid_from,
            "valid_to": valid_to
        }

        with engine.begin() as connection:
            result = connection.execute(text(query), params)
            capacity_id = result.fetchone()[0]

        return jsonify({"message": "Parking space capacity added successfully", "id": capacity_id}), 201
    except Exception as e:
        logger.error("Failed to add parking space capacity", exc_info=True)
        return jsonify({"error": str(e)}), 500

# Edit parking space capacity
@app.route("/edit_parking_space_capacities", methods=["PUT"])
def edit_parking_space_capacities():
    """
    Endpoint to edit an existing parking space capacity.
    """
    try:
        data = request.json
        capacity_id = data.get("id")
        parking_lot_id = data.get("parking_lot_id")
        capacity = data.get("capacity")
        utilization_type = data.get("utilization_type")
        truck_limit = data.get("truck_limit")
        bus_limit = data.get("bus_limit")
        valid_from = data.get("valid_from")
        valid_to = data.get("valid_to")

        if not (capacity_id and parking_lot_id and capacity and utilization_type and truck_limit and bus_limit and valid_from and valid_to):
            return jsonify({"error": "All fields are required"}), 400

        query = """
        UPDATE public.parking_lot_capacity
        SET parking_lot_id = :parking_lot_id,
            capacity = :capacity,
            utilization_type = :utilization_type,
            truck_limit = :truck_limit,
            bus_limit = :bus_limit,
            valid_from = :valid_from,
            valid_to = :valid_to
        WHERE id = :capacity_id
        """
        params = {
            "capacity_id": capacity_id,
            "parking_lot_id": parking_lot_id,
            "capacity": capacity,
            "utilization_type": utilization_type,
            "truck_limit": truck_limit,
            "bus_limit": bus_limit,
            "valid_from": valid_from,
            "valid_to": valid_to
        }

        with engine.begin() as connection:
            connection.execute(text(query), params)

        return jsonify({"message": "Parking space capacity updated successfully"}), 200
    except Exception as e:
        logger.error("Failed to update parking space capacity", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.config["DEBUG"] = True
    app.run(host="0.0.0.0", port=5000)
