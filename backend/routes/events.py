import os
import logging
from flask import Blueprint, jsonify, request
from extensions import db
from utils.helpers import get_data
import pandas as pd
from sqlalchemy import text
from datetime import datetime, timedelta


events_bp = Blueprint("events", __name__)
logger = logging.getLogger(__name__)


@events_bp.route("/events", methods=["GET"])
def get_events():
    try:
        query_events = """
            SELECT e.id, e.name, e.assembly_start_date, e.assembly_end_date, e.runtime_start_date, e.runtime_end_date, e.disassembly_start_date, e.disassembly_end_date, e.color,
            ARRAY(SELECT DISTINCT h.name FROM hall h INNER JOIN hall_occupation ho ON h.id = ho.hall_id WHERE ho.event_id = e.id) AS halls,
            ARRAY(SELECT DISTINCT en.name FROM entrance en INNER JOIN entrance_occupation eo ON en.id = eo.entrance_id WHERE eo.event_id = e.id) AS entrances
            FROM event e
            ORDER BY e.runtime_start_date
        """
        query_demands = """
            SELECT vd.event_id, vd.status, SUM(vd.demand) AS total_demand
            FROM visitor_demand vd
            GROUP BY vd.event_id, vd.status
        """

        events = get_data(query_events).to_dict(orient="records")
        demands = get_data(query_demands).to_dict(orient="records")

        event_map = {event["id"]: event for event in events}
        for demand in demands:
            event_id = demand["event_id"]
            if event_id in event_map:
                event_map[event_id][f"{demand['status']}_demand"] = demand[
                    "total_demand"
                ]

        # Add status to each event
        for event in event_map.values():
            if "assembly_demand" not in event:
                event["status"] = "no_demands"
            else:
                total_demand = (
                    event.get("assembly_demand", 0)
                    + event.get("runtime_demand", 0)
                    + event.get("disassembly_demand", 0)
                )
                if total_demand == 0:
                    event["status"] = "no_demands"
                else:
                    event["status"] = "not_enough_capacity"

        return jsonify(list(event_map.values())), 200
    except Exception as e:
        logger.error(e)
        return jsonify({"error": str(e)}), 500


@events_bp.route("/events_status", methods=["GET"])
def get_event_status():
    try:
        query = """
        WITH event_details AS (
            SELECT
                e.id AS event_id,
                e.name AS event_name,
                e.assembly_start_date,
                e.assembly_end_date,
                e.runtime_start_date,
                e.runtime_end_date,
                e.disassembly_start_date,
                e.disassembly_end_date
            FROM
                public.event e
        ),
        daily_demands AS (
            SELECT
                vd.date,
                SUM(vd.demand) AS total_demand,
                SUM(vd.car_demand) AS total_car_demand,
                SUM(vd.truck_demand) AS total_truck_demand,
                SUM(vd.bus_demand) AS total_bus_demand
            FROM
                public.visitor_demand vd
            GROUP BY
                vd.date
        ),
        daily_allocations AS (
            SELECT
                pa.date,
                COALESCE(SUM(pa.allocated_capacity), 0) AS total_allocated_capacity,
                COALESCE(SUM(pa.allocated_cars), 0) AS total_allocated_cars,
                COALESCE(SUM(pa.allocated_trucks), 0) AS total_allocated_trucks,
                COALESCE(SUM(pa.allocated_buses), 0) AS total_allocated_buses
            FROM
                public.parking_lot_allocation pa
            GROUP BY
                pa.date
        ),
        capacity_per_date AS (
            SELECT
                pc.parking_lot_id,
                pc.capacity,
                pc.truck_limit,
                pc.bus_limit,
                pc.valid_from,
                pc.valid_to,
                generate_series(pc.valid_from, pc.valid_to, '1 day'::interval)::date AS date
            FROM
                public.parking_lot_capacity pc
        ),
        total_capacity_per_day AS (
            SELECT
                date,
                SUM(capacity) AS total_capacity,
                SUM(capacity) AS total_car_capacity,
                SUM(truck_limit) AS total_truck_capacity,
                SUM(bus_limit) AS total_bus_capacity
            FROM
                capacity_per_date
            GROUP BY
                date
        ),
        combined AS (
            SELECT
                ed.event_id,
                ed.event_name,
                ed.assembly_start_date,
                ed.assembly_end_date,
                ed.runtime_start_date,
                ed.runtime_end_date,
                ed.disassembly_start_date,
                ed.disassembly_end_date,
                dd.date,
                dd.total_demand,
                dd.total_car_demand,
                dd.total_truck_demand,
                dd.total_bus_demand,
                COALESCE(da.total_allocated_capacity, 0) AS total_allocated_capacity,
                COALESCE(da.total_allocated_cars, 0) AS total_allocated_cars,
                COALESCE(da.total_allocated_trucks, 0) AS total_allocated_trucks,
                COALESCE(da.total_allocated_buses, 0) AS total_allocated_buses,
                tcd.total_capacity,
                tcd.total_truck_capacity,
                tcd.total_bus_capacity,
                tcd.total_car_capacity
            FROM
                event_details ed
            LEFT JOIN
                daily_demands dd ON dd.date BETWEEN ed.assembly_start_date AND ed.disassembly_end_date
            LEFT JOIN
                daily_allocations da ON da.date = dd.date
            LEFT JOIN
                total_capacity_per_day tcd ON dd.date = tcd.date
        )
        SELECT
            event_id,
            event_name,
            assembly_start_date,
            assembly_end_date,
            runtime_start_date,
            runtime_end_date,
            disassembly_start_date,
            disassembly_end_date,
            date,
            total_demand,
            total_car_demand,
            total_truck_demand,
            total_bus_demand,
            total_allocated_capacity,
            total_allocated_cars,
            total_allocated_trucks,
            total_allocated_buses,
            total_capacity,
            total_truck_capacity,
            total_bus_capacity,
            total_car_capacity,
            CASE
                WHEN total_demand IS NULL THEN 'no_demands'
                WHEN total_demand > total_capacity THEN 'not_enough_capacity'
                WHEN total_demand > total_allocated_capacity THEN 'demands_to_allocate'
                WHEN (total_demand > 0 AND total_allocated_capacity = 0) THEN 'demands_to_allocate'
                ELSE 'ok'
            END AS status
        FROM
            combined
        ORDER BY
            event_id, date;

        """

        df = pd.read_sql_query(query, db.engine)
        events_status = df.to_dict(orient="records")

        # Print the table for debugging
        logger.info("Event Status Table:")
        for row in events_status:
            logger.info(row)

        return jsonify(events_status), 200
    except Exception as e:
        logger.error(e)
        return jsonify({"error": str(e)}), 500


@events_bp.route("/event", methods=["POST"])
def add_event():
    try:
        data = request.json
        event_data = {
            "name": data["name"],
            "assembly_start_date": data["assembly_start_date"],
            "assembly_end_date": data["assembly_end_date"],
            "runtime_start_date": data["runtime_start_date"],
            "runtime_end_date": data["runtime_end_date"],
            "disassembly_start_date": data["disassembly_start_date"],
            "disassembly_end_date": data["disassembly_end_date"],
            "color": data["color"],
        }

        # Insert the event
        event_query = """
            INSERT INTO public.event (name, assembly_start_date, assembly_end_date, runtime_start_date, runtime_end_date, disassembly_start_date, disassembly_end_date, color)
            VALUES (:name, :assembly_start_date, :assembly_end_date, :runtime_start_date, :runtime_end_date, :disassembly_start_date, :disassembly_end_date, :color)
            RETURNING id
        """
        result = db.session.execute(text(event_query), event_data)
        event_id = result.fetchone()[0]

        # Insert halls
        if "halls" in data:
            hall_ids = db.session.execute(
                text("SELECT id FROM hall WHERE name IN :names"),
                {"names": tuple(data["halls"])},
            ).fetchall()
            for hall_id in hall_ids:
                hall_id = hall_id[0]  # fetchall() returns a list of tuples
                current_date = datetime.strptime(
                    data["assembly_start_date"], "%Y-%m-%d"
                )
                end_date = datetime.strptime(data["disassembly_end_date"], "%Y-%m-%d")
                while current_date <= end_date:
                    hall_query = """
                        INSERT INTO hall_occupation (event_id, hall_id, date)
                        VALUES (:event_id, :hall_id, :date)
                    """
                    db.session.execute(
                        text(hall_query),
                        {
                            "event_id": event_id,
                            "hall_id": hall_id,
                            "date": current_date.strftime("%Y-%m-%d"),
                        },
                    )
                    current_date += timedelta(days=1)

        # Insert entrances
        if "entrances" in data:
            entrance_ids = db.session.execute(
                text("SELECT id FROM entrance WHERE name IN :names"),
                {"names": tuple(data["entrances"])},
            ).fetchall()
            for entrance_id in entrance_ids:
                entrance_id = entrance_id[0]  # fetchall() returns a list of tuples
                current_date = datetime.strptime(
                    data["assembly_start_date"], "%Y-%m-%d"
                )
                end_date = datetime.strptime(data["disassembly_end_date"], "%Y-%m-%d")
                while current_date <= end_date:
                    entrance_query = """
                        INSERT INTO entrance_occupation (event_id, entrance_id, date)
                        VALUES (:event_id, :entrance_id, :date)
                    """
                    db.session.execute(
                        text(entrance_query),
                        {
                            "event_id": event_id,
                            "entrance_id": entrance_id,
                            "date": current_date.strftime("%Y-%m-%d"),
                        },
                    )
                    current_date += timedelta(days=1)

        # Initialize visitor demand with zero values for each day within the event period
        current_date = datetime.strptime(data["assembly_start_date"], "%Y-%m-%d")
        end_date = datetime.strptime(data["disassembly_end_date"], "%Y-%m-%d")
        while current_date <= end_date:
            if current_date < datetime.strptime(data["runtime_start_date"], "%Y-%m-%d"):
                status = "assembly"
            elif current_date <= datetime.strptime(
                data["runtime_end_date"], "%Y-%m-%d"
            ):
                status = "runtime"
            else:
                status = "disassembly"
            demand_query = """
                INSERT INTO visitor_demand (event_id, date, car_demand, truck_demand, bus_demand, status)
                VALUES (:event_id, :date, 0, 0, 0, :status)
            """
            db.session.execute(
                text(demand_query),
                {
                    "event_id": event_id,
                    "date": current_date.strftime("%Y-%m-%d"),
                    "status": status,
                },
            )
            current_date += timedelta(days=1)

        db.session.commit()
        return jsonify({"id": event_id}), 201
    except Exception as e:
        logger.error(e)
        return jsonify({"error": str(e)}), 500


@events_bp.route("/event/<int:id>", methods=["PUT"])
def edit_event(id):
    try:
        data = request.json
        data["id"] = id

        # Update the event details
        update_event_query = text(
            """
            UPDATE public.event
            SET name = :name,
                assembly_start_date = :assembly_start_date,
                assembly_end_date = :assembly_end_date,
                runtime_start_date = :runtime_start_date,
                runtime_end_date = :runtime_end_date,
                disassembly_start_date = :disassembly_start_date,
                disassembly_end_date = :disassembly_end_date,
                color = :color
            WHERE id = :id
            """
        )
        db.session.execute(update_event_query, data)

        # Clear existing halls and entrances
        clear_halls_query = text("DELETE FROM hall_occupation WHERE event_id = :id")
        clear_entrances_query = text(
            "DELETE FROM entrance_occupation WHERE event_id = :id"
        )

        db.session.execute(clear_halls_query, {"id": id})
        db.session.execute(clear_entrances_query, {"id": id})

        # Insert new halls
        insert_halls_query = text(
            """
            INSERT INTO hall_occupation (event_id, hall_id, date)
            SELECT :event_id, id, (SELECT runtime_start_date FROM public.event WHERE id = :event_id)
            FROM hall
            WHERE name = :hall_name
            """
        )
        for hall_name in data["halls"]:
            db.session.execute(
                insert_halls_query, {"event_id": id, "hall_name": hall_name}
            )

        # Insert new entrances
        insert_entrances_query = text(
            """
            INSERT INTO entrance_occupation (event_id, entrance_id, date)
            SELECT :event_id, id, (SELECT runtime_start_date FROM public.event WHERE id = :event_id)
            FROM entrance
            WHERE name = :entrance_name
            """
        )
        for entrance_name in data["entrances"]:
            db.session.execute(
                insert_entrances_query, {"event_id": id, "entrance_name": entrance_name}
            )

        db.session.commit()
        return jsonify({"message": "Event updated successfully"}), 200
    except Exception as e:
        logger.error(e)
        return jsonify({"error": str(e)}), 500


@events_bp.route("/event/<int:id>", methods=["GET"])
def get_event(id):
    try:
        query_event = """
            SELECT e.id, e.name, e.assembly_start_date, e.assembly_end_date, e.runtime_start_date, e.runtime_end_date, e.disassembly_start_date, e.disassembly_end_date, e.color,
            ARRAY(SELECT DISTINCT h.name FROM hall h INNER JOIN hall_occupation ho ON h.id = ho.hall_id WHERE ho.event_id = e.id) AS halls,
            ARRAY(SELECT DISTINCT en.name FROM entrance en INNER JOIN entrance_occupation eo ON en.id = eo.entrance_id WHERE eo.event_id = e.id) AS entrances
            FROM event e
            WHERE e.id = :id
        """
        event = get_data(query_event, {"id": id}).to_dict(orient="records")
        if event:
            return jsonify(event[0]), 200
        else:
            return jsonify({"error": "Event not found"}), 404
    except Exception as e:
        logger.error(e)
        return jsonify({"error": str(e)}), 500


@events_bp.route("/demands/<int:event_id>", methods=["GET"])
def get_event_demands(event_id):
    try:
        query = """
            SELECT vd.id, vd.date, vd.car_demand, vd.truck_demand, vd.bus_demand, vd.demand, vd.status
            FROM visitor_demand vd
            WHERE vd.event_id = :event_id
        """
        demands = get_data(query, {"event_id": event_id}).to_dict(orient="records")
        if not demands:
            return jsonify([]), 204
        return jsonify(demands), 200
    except Exception as e:
        logger.error(e)
        return jsonify({"error": str(e)}), 500


@events_bp.route("/allocations/<int:event_id>", methods=["GET"])
def get_event_allocations(event_id):
    try:
        query = """
            SELECT date, allocated_cars, allocated_trucks, allocated_buses, allocated_capacity
            FROM public.parking_lot_allocation
            WHERE event_id = :event_id
        """
        allocations = get_data(query, {"event_id": event_id}).to_dict(orient="records")
        if not allocations:
            return jsonify([]), 204
        return jsonify(allocations), 200
    except Exception as e:
        logger.error(e)
        return jsonify({"error": str(e)}), 500


@events_bp.route("/demands/<int:event_id>", methods=["PUT"])
def update_event_demands(event_id):
    try:
        data = request.json
        for demand in data:
            demand["event_id"] = event_id
            query = text(
                """
                UPDATE visitor_demand
                SET car_demand = :car_demand,
                    truck_demand = :truck_demand,
                    bus_demand = :bus_demand,
                    status = :status
                WHERE id = :id AND event_id = :event_id
            """
            )
            db.session.execute(query, demand)
        db.session.commit()
        return jsonify({"message": "Demands updated successfully"}), 200
    except Exception as e:
        logger.error(e)
        return jsonify({"error": str(e)}), 500
