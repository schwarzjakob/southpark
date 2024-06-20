import os
import logging
from flask import Blueprint, jsonify, request
from sqlalchemy import text
from datetime import datetime, timedelta
from extensions import db
from utils.helpers import get_data, parse_date, calculate_date_range
from scripts.allocation_algorithm import fetch_and_optimize_parking_lots
from sqlalchemy import create_engine, text

events_bp = Blueprint('events', __name__)
logger = logging.getLogger(__name__)

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise ValueError("No DATABASE_URL found in environment variables")

engine = create_engine(database_url)


@events_bp.route("/", methods=["GET"])
def get_events():
    try:
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

        return jsonify(list(event_map.values())), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@events_bp.route("/<int:id>", methods=["PUT"])
def update_event(id):
    try:
        data = request.json

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

        with db.engine.begin() as connection:
            connection.execute(text(event_query), event_params)
            connection.execute(
                text("DELETE FROM hall_occupation WHERE event_id = :event_id"),
                {"event_id": id},
            )

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
        return jsonify({"error": str(e)}), 500


@events_bp.route("/add_event", methods=["POST"])
def add_event():
    try:
        data = request.json
        name = data["name"]
        dates = data["dates"]
        halls = data["halls"]
        entrances = data["entrances"]
        demands = data["demands"]

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

        with db.engine.begin() as connection:
            result = connection.execute(text(query_event), params_event)
            event_id = result.fetchone()[0]

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
        return jsonify({"error": str(e)}), 500


@events_bp.route("/import_events", methods=["POST"])
def import_events():
    try:
        data = request.json
        csv_data = data.get("csv_data")
        mapping = data.get("mapping", {
            "name": "name",
            "halls": "halls",
            "assembly_start_date": "assembly_start_date",
            "assembly_end_date": "assembly_end_date",
            "runtime_start_date": "runtime_start_date",
            "runtime_end_date": "runtime_end_date",
            "disassembly_start_date": "disassembly_start_date",
            "disassembly_end_date": "disassembly_end_date",
            "entrance": "entrance",
        })

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

        missing_fields = [field for field in required_fields if field not in mapping]
        if missing_fields:
            return jsonify({"error": f"Missing required fields in mapping: {missing_fields}"}), 400

        events = []
        for row in csv_data:
            try:
                event = {
                    "name": row.get(mapping["name"], "").strip(),
                    "assembly_start_date": row.get(mapping["assembly_start_date"], "").strip(),
                    "assembly_end_date": row.get(mapping["assembly_end_date"], "").strip(),
                    "runtime_start_date": row.get(mapping["runtime_start_date"], "").strip(),
                    "runtime_end_date": row.get(mapping["runtime_end_date"], "").strip(),
                    "disassembly_start_date": row.get(mapping["disassembly_start_date"], "").strip(),
                    "disassembly_end_date": row.get(mapping["disassembly_end_date"], "").strip(),
                    "entrance": row.get(mapping["entrance"], "").strip(),
                    "halls": [hall.strip() for hall in row.get(mapping["halls"], "").split(",")],
                }

                for key, value in event.items():
                    if not value and key != "halls":
                        raise KeyError(f"Missing field in row: '{key}'")

                events.append(event)
            except KeyError as e:
                continue

        with db.engine.begin() as connection:
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
                            "demand": 0,
                            "status": phase,
                        }
                        connection.execute(text(query_demand), params_demand)

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
                            connection.execute(text(query_hall_occupation), params_hall_occupation)

        return jsonify({"message": "Events imported successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@events_bp.route("/events_without_valid_demands", methods=["GET"])
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
        return jsonify({"events": events}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@events_bp.route("/add_demands/<int:event_id>", methods=["POST"])
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

        with db.engine.begin() as connection:
            for query, params in queries:
                connection.execute(text(query), params)

        return jsonify({"message": "Demands updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@events_bp.route("/check_hall_availability", methods=["POST"])
def check_hall_availability():
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

        with db.engine.connect() as connection:
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

        for date in all_dates:
            free_halls_by_date[date] = sorted(
                all_halls
                - set(
                    hall_map[hall_id]
                    for hall_id, hall_name in hall_ids
                    if hall_name in occupied_halls
                )
            )

        selected_occupied_halls = {
            hall: occupied_halls[hall]
            for hall in selected_halls
            if hall in occupied_halls
        }

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
        return jsonify({"error": str(e)}), 500

@events_bp.route("/optimize_distance", methods=["POST"])
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
        message = fetch_and_optimize_parking_lots()
        logger.info("Optimization and saving of results completed successfully.")
        return jsonify({"message": message}), 200
    except Exception as e:
        logger.error("Error during optimization process", exc_info=True)
        return jsonify({"error": str(e)}), 500
