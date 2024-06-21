import os
import logging
from flask import Blueprint, jsonify
from extensions import db
from utils.helpers import get_data
import pandas as pd

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
                da.total_allocated_capacity,
                da.total_allocated_cars,
                da.total_allocated_trucks,
                da.total_allocated_buses,
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
        ),
        daily_status AS (
            SELECT
                event_id,
                event_name,
                date,
                CASE
                    WHEN total_demand IS NULL THEN 'no_demands'
                    WHEN total_capacity < total_demand THEN 'not_enough_capacity'
                    WHEN total_demand > total_allocated_capacity THEN 'demands_to_allocate'
                    ELSE 'ok'
                END AS status
            FROM
                combined
        )
        SELECT
            ds.event_id,
            ed.event_name,
            CASE
                WHEN MAX(CASE WHEN ds.status = 'not_enough_capacity' THEN 1 ELSE 0 END) = 1 THEN 'not_enough_capacity'
                WHEN MAX(CASE WHEN ds.status = 'demands_to_allocate' THEN 1 ELSE 0 END) = 1 THEN 'demands_to_allocate'
                WHEN MAX(CASE WHEN ds.status = 'no_demands' THEN 1 ELSE 0 END) = 1 THEN 'no_demands'
                ELSE 'ok'
            END AS status
        FROM
            daily_status ds
        JOIN
            event_details ed ON ds.event_id = ed.event_id
        GROUP BY
            ds.event_id, ed.event_name
        ORDER BY
            ds.event_id;
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


@events_bp.route("/events", methods=["POST"])
def add_event():
    try:
        data = request.json
        query = """
            INSERT INTO public.event (name, assembly_start_date, assembly_end_date, runtime_start_date, runtime_end_date, disassembly_start_date, disassembly_end_date, color)
            VALUES (:name, :assembly_start_date, :assembly_end_date, :runtime_start_date, :runtime_end_date, :disassembly_start_date, :disassembly_end_date, :color)
            RETURNING id
        """
        result = db.session.execute(query, data)
        db.session.commit()
        event_id = result.fetchone()[0]
        return jsonify({"id": event_id}), 201
    except Exception as e:
        logger.error(e)
        return jsonify({"error": str(e)}), 500


@events_bp.route("/event/<int:id>", methods=["PUT"])
def edit_event(id):
    try:
        data = request.json
        data["id"] = id
        query = """
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
        db.session.execute(query, data)
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
