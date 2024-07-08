import os
import logging
from flask import Blueprint, jsonify, request
from extensions import db
from utils.helpers import get_data
import pandas as pd
from sqlalchemy import text
from datetime import datetime, timedelta
from functools import wraps
from routes.auth import check_edit_rights

events_bp = Blueprint("events", __name__)
logger = logging.getLogger(__name__)

@events_bp.route("/events", methods=["GET"])
def get_events():
    try:
        query_events = """
            SELECT e.id, e.name, e.assembly_start_date, e.assembly_end_date, e.runtime_start_date, e.runtime_end_date, e.disassembly_start_date, e.disassembly_end_date, e.color,
            ARRAY(
                SELECT DISTINCT jsonb_build_object('id', h.id, 'name', h.name)
                FROM hall h
                INNER JOIN hall_occupation ho ON h.id = ho.hall_id
                WHERE ho.event_id = e.id
            ) AS halls,
            ARRAY(
                SELECT DISTINCT jsonb_build_object('id', en.id, 'name', en.name)
                FROM entrance en
                INNER JOIN entrance_occupation eo ON en.id = eo.entrance_id
                WHERE eo.event_id = e.id
            ) AS entrances
            FROM event e
            ORDER BY e.runtime_start_date
        """
        query_demands = """
            SELECT vd.event_id, vd.status, SUM(vd.demand) AS total_demand
            FROM visitor_demand vd
            GROUP BY vd.event_id, vd.status
        """
        query_parking_lots = """
            SELECT pa.event_id, pl.id AS parking_lot_id, pl.name AS parking_lot_name
            FROM public.parking_lot_allocation pa
            JOIN public.parking_lot pl ON pa.parking_lot_id = pl.id
            GROUP BY pa.event_id, pl.id, pl.name
        """

        events = get_data(query_events).to_dict(orient="records")
        demands = get_data(query_demands).to_dict(orient="records")
        parking_lots = get_data(query_parking_lots).to_dict(orient="records")

        event_map = {event["id"]: event for event in events}

        for demand in demands:
            event_id = demand["event_id"]
            if event_id in event_map:
                event_map[event_id][f"{demand['status']}_demand"] = demand[
                    "total_demand"
                ]

        for parking_lot in parking_lots:
            event_id = parking_lot["event_id"]
            if event_id in event_map:
                if "allocatedParkingLots" not in event_map[event_id]:
                    event_map[event_id]["allocatedParkingLots"] = []
                event_map[event_id]["allocatedParkingLots"].append(
                    parking_lot["parking_lot_name"]
                )

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
        WITH daily_capacity AS (
            SELECT 
                generate_series(pc.valid_from, pc.valid_to, '1 day'::interval)::date AS date,
                SUM(pc.capacity) AS total_capacity
            FROM public.parking_lot_capacity pc
            GROUP BY date
        ),
        daily_demands AS (
            SELECT 
                vd.date,
                SUM(vd.demand) AS total_demand
            FROM public.visitor_demand vd
            GROUP BY vd.date
        ),
        daily_allocations AS (
            SELECT 
                pa.date,
                SUM(pa.allocated_capacity) AS total_allocated_demand
            FROM public.parking_lot_allocation pa
            GROUP BY pa.date
        ),
        event_specific_demands AS (
            SELECT 
                vd.event_id,
                vd.date,
                SUM(vd.demand) AS total_event_demand
            FROM public.visitor_demand vd
            GROUP BY vd.event_id, vd.date
        ),
        event_specific_allocations AS (
            SELECT 
                pa.event_id,
                pa.date,
                SUM(pa.allocated_capacity) AS total_event_allocated_demand
            FROM public.parking_lot_allocation pa
            GROUP BY pa.event_id, pa.date
        ),
        combined AS (
            SELECT
                d.date,
                COALESCE(dc.total_capacity, 0) AS total_capacity,
                COALESCE(dd.total_demand, 0) AS total_demand,
                COALESCE(da.total_allocated_demand, 0) AS total_allocated_demand
            FROM
                generate_series(
                    (SELECT MIN(valid_from) FROM public.parking_lot_capacity),
                    (SELECT MAX(valid_to) FROM public.parking_lot_capacity),
                    '1 day'::interval
                ) AS d(date)
            LEFT JOIN daily_capacity dc ON d.date = dc.date
            LEFT JOIN daily_demands dd ON d.date = dd.date
            LEFT JOIN daily_allocations da ON d.date = da.date
        ),
        event_periods AS (
            SELECT
                e.id AS event_id,
                e.name,
                generate_series(e.assembly_start_date, e.disassembly_end_date, '1 day'::interval)::date AS date
            FROM public.event e
        ),
        event_daily_status AS (
            SELECT
                ep.event_id,
                ep.name,
                ep.date,
                c.total_capacity,
                c.total_demand,
                c.total_allocated_demand,
                COALESCE(esd.total_event_demand, 0) AS total_event_demand,
                COALESCE(esa.total_event_allocated_demand, 0) AS total_event_allocated_demand,
                CASE
                    WHEN COALESCE(esd.total_event_demand, 0) = 0 THEN 'no_demands'
                    WHEN c.total_demand > c.total_capacity THEN 'not_enough_capacity'
                    WHEN COALESCE(esd.total_event_demand, 0) > 0 AND COALESCE(esa.total_event_allocated_demand, 0) < COALESCE(esd.total_event_demand, 0) THEN 'demands_to_allocate'
                    ELSE 'ok'
                END AS status
            FROM
                event_periods ep
            LEFT JOIN combined c ON ep.date = c.date
            LEFT JOIN event_specific_demands esd ON ep.event_id = esd.event_id AND ep.date = esd.date
            LEFT JOIN event_specific_allocations esa ON ep.event_id = esa.event_id AND ep.date = esa.date
        )
        SELECT
            event_id,
            name,
            total_capacity,
            total_demand,
            total_allocated_demand,
            total_event_demand,
            total_event_allocated_demand,
            status
        FROM event_daily_status
        ORDER BY name, date;
        """

        df = pd.read_sql_query(query, db.engine)
        events_status = df.to_dict(orient="records")

        logger.info("Event Status Table:")
        for row in events_status:
            if row["event_id"] == 13:
                logger.info(row)

        event_status_summary = {}

        for row in events_status:
            event_id = row["event_id"]
            status = row["status"]

            if event_id not in event_status_summary:
                event_status_summary[event_id] = {
                    "event_id": event_id,
                    "name": row["name"],
                    "status": "ok",
                }

            if status == "not_enough_capacity":
                event_status_summary[event_id]["status"] = "not_enough_capacity"
            elif (
                status == "demands_to_allocate"
                and event_status_summary[event_id]["status"] != "not_enough_capacity"
            ):
                event_status_summary[event_id]["status"] = "demands_to_allocate"
            elif status == "no_demands" and event_status_summary[event_id][
                "status"
            ] not in ["not_enough_capacity", "demands_to_allocate"]:
                event_status_summary[event_id]["status"] = "no_demands"

        summary_list = list(event_status_summary.values())

        return jsonify(summary_list), 200
    except Exception as e:
        logger.error(e)
        return jsonify({"error": str(e)}), 500


@events_bp.route("/occupied_halls", methods=["GET"])
def get_occupied_halls():
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        if not start_date or not end_date:
            return jsonify({"error": "start_date and end_date are required"}), 400

        query = text(
            """
            SELECT DISTINCT h.name
            FROM public.hall h
            JOIN public.hall_occupation ho ON h.id = ho.hall_id
            WHERE ho.date BETWEEN :start_date AND :end_date
        """
        )

        occupied_halls = db.session.execute(
            query, {"start_date": start_date, "end_date": end_date}
        ).fetchall()
        occupied_halls = [row[0] for row in occupied_halls]

        return jsonify(occupied_halls), 200
    except Exception as e:
        logger.error(e)
        return jsonify({"error": str(e)}), 500


@events_bp.route("/occupied_halls/<int:event_id>", methods=["GET"])
def get_occupied_halls_without_event(event_id):
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        if not start_date or not end_date:
            return jsonify({"error": "start_date and end_date are required"}), 400

        query = text(
            """
            SELECT DISTINCT h.name
            FROM public.hall h
            JOIN public.hall_occupation ho ON h.id = ho.hall_id
            WHERE ho.date BETWEEN :start_date AND :end_date
            AND ho.event_id != :event_id
            """
        )

        occupied_halls = db.session.execute(
            query,
            {"start_date": start_date, "end_date": end_date, "event_id": event_id},
        ).fetchall()
        occupied_halls = [row[0] for row in occupied_halls]

        return jsonify(occupied_halls), 200
    except Exception as e:
        logger.error(e)
        return jsonify({"error": str(e)}), 500


@events_bp.route("/event", methods=["POST"])
@check_edit_rights
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

        event_query = """
            INSERT INTO public.event (name, assembly_start_date, assembly_end_date, runtime_start_date, runtime_end_date, disassembly_start_date, disassembly_end_date, color)
            VALUES (:name, :assembly_start_date, :assembly_end_date, :runtime_start_date, :runtime_end_date, :disassembly_start_date, :disassembly_end_date, :color)
            RETURNING id
        """
        result = db.session.execute(text(event_query), event_data)
        event_id = result.fetchone()[0]

        if "halls" in data:
            hall_ids = db.session.execute(
                text("SELECT id FROM hall WHERE name IN :names"),
                {"names": tuple(data["halls"])},
            ).fetchall()
            for hall_id in hall_ids:
                hall_id = hall_id[0]  
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

        if "entrances" in data:
            entrance_ids = db.session.execute(
                text("SELECT id FROM entrance WHERE name IN :names"),
                {"names": tuple(data["entrances"])},
            ).fetchall()
            for entrance_id in entrance_ids:
                entrance_id = entrance_id[0]  
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
@check_edit_rights
def edit_event(id):
    try:
        data = request.json
        logger.debug(f"Received data for event update: {data}")
        data["id"] = id

        date_fields = [
            "assembly_start_date",
            "assembly_end_date",
            "runtime_start_date",
            "runtime_end_date",
            "disassembly_start_date",
            "disassembly_end_date",
        ]

        for field in date_fields:
            if field in data:
                try:
                    parsed_date = datetime.strptime(
                        data[field], "%a, %d %b %Y %H:%M:%S %Z"
                    )
                    data[field] = parsed_date.strftime("%Y-%m-%d")
                except ValueError as ve:
                    logger.debug(f"Failed to parse date {data[field]} with error: {ve}")
                    try:
                        parsed_date = datetime.strptime(data[field], "%Y-%m-%d")
                        data[field] = parsed_date.strftime("%Y-%m-%d")
                    except ValueError as ve2:
                        logger.error(
                            f"Failed to parse date {data[field]} in both formats with error: {ve2}"
                        )
                        return (
                            jsonify({"error": f"Failed to parse date {data[field]}"}),
                            400,
                        )

        logger.debug(f"Data after date conversion: {data}")

        original_event = get_data(
            """
            SELECT assembly_start_date, assembly_end_date, runtime_start_date, runtime_end_date, disassembly_start_date, disassembly_end_date
            FROM public.event
            WHERE id = :id
            """,
            {"id": id},
        ).to_dict(orient="records")[0]

        logger.debug(f"Original event dates: {original_event}")

        def date_range(start_date, end_date):
            return set(
                pd.date_range(start=start_date, end=end_date).strftime("%Y-%m-%d")
            )

        original_dates = (
            date_range(
                original_event["assembly_start_date"],
                original_event["assembly_end_date"],
            )
            | date_range(
                original_event["runtime_start_date"], original_event["runtime_end_date"]
            )
            | date_range(
                original_event["disassembly_start_date"],
                original_event["disassembly_end_date"],
            )
        )

        new_dates = (
            date_range(data["assembly_start_date"], data["assembly_end_date"])
            | date_range(data["runtime_start_date"], data["runtime_end_date"])
            | date_range(data["disassembly_start_date"], data["disassembly_end_date"])
        )

        dates_to_remove = original_dates - new_dates
        dates_to_add = new_dates - original_dates

        logger.debug(f"Dates to remove: {dates_to_remove}")
        logger.debug(f"Dates to add: {dates_to_add}")

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

        clear_halls_query = text("DELETE FROM hall_occupation WHERE event_id = :id")
        clear_entrances_query = text(
            "DELETE FROM entrance_occupation WHERE event_id = :id"
        )

        db.session.execute(clear_halls_query, {"id": id})
        db.session.execute(clear_entrances_query, {"id": id})

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

        if dates_to_remove:
            delete_demands_query = text(
                "DELETE FROM visitor_demand WHERE event_id = :event_id AND date IN :dates"
            )
            db.session.execute(
                delete_demands_query, {"event_id": id, "dates": tuple(dates_to_remove)}
            )

            delete_allocations_query = text(
                "DELETE FROM public.parking_lot_allocation WHERE event_id = :event_id AND date IN :dates"
            )
            db.session.execute(
                delete_allocations_query,
                {"event_id": id, "dates": tuple(dates_to_remove)},
            )

        for date in new_dates - dates_to_add:
            date_obj = datetime.strptime(date, "%Y-%m-%d")
            if date_obj < datetime.strptime(data["runtime_start_date"], "%Y-%m-%d"):
                new_status = "assembly"
            elif date_obj <= datetime.strptime(data["runtime_end_date"], "%Y-%m-%d"):
                new_status = "runtime"
            else:
                new_status = "disassembly"
            update_demand_query = text(
                "UPDATE visitor_demand SET status = :status WHERE event_id = :event_id AND date = :date"
            )
            db.session.execute(
                update_demand_query,
                {"event_id": id, "date": date, "status": new_status},
            )

        for date in dates_to_add:
            date_obj = datetime.strptime(date, "%Y-%m-%d")
            if date_obj < datetime.strptime(data["runtime_start_date"], "%Y-%m-%d"):
                status = "assembly"
            elif date_obj <= datetime.strptime(data["runtime_end_date"], "%Y-%m-%d"):
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
                    "event_id": id,
                    "date": date,
                    "status": status,
                },
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


@events_bp.route("/allocations/<int:eventid>", methods=["GET"])
def get_event_allocations(eventid):
    try:
        query = """
            SELECT 
                pa.id AS allocation_id,
                pa.date, 
                pa.allocated_cars, 
                pa.allocated_trucks, 
                pa.allocated_buses, 
                pa.allocated_capacity,
                pl.id AS parking_lot_id,
                pl.name AS parking_lot_name
            FROM 
                public.parking_lot_allocation pa
            JOIN 
                public.parking_lot pl ON pa.parking_lot_id = pl.id
            WHERE 
                pa.event_id = :event_id
        """
        allocations = get_data(query, {"event_id": eventid}).to_dict(orient="records")
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


@events_bp.route("/parking_lot_capacities", methods=["GET"])
def get_parking_lot_capacities():
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        if not start_date or not end_date:
            return jsonify({"error": "start_date and end_date are required"}), 400

        query = text(
            """
        WITH capacity_per_date AS (
            SELECT
                pc.parking_lot_id,
                pc.capacity,
                pc.truck_limit,
                pc.bus_limit,
                generate_series(pc.valid_from, pc.valid_to, '1 day'::interval) AS date
            FROM
                public.parking_lot_capacity pc
        ),
        allocations AS (
            SELECT
                pa.date,
                pa.parking_lot_id,
                pa.event_id,
                pa.allocated_capacity,
                pa.allocated_cars,
                pa.allocated_trucks,
                pa.allocated_buses
            FROM
                public.parking_lot_allocation pa
        ),
        combined AS (
            SELECT
                cpd.date,
                cpd.parking_lot_id,
                cpd.capacity,
                cpd.truck_limit,
                cpd.bus_limit,
                COALESCE(SUM(a.allocated_capacity), 0) AS used_capacity,
                COALESCE(SUM(a.allocated_cars), 0) AS used_cars,
                COALESCE(SUM(a.allocated_trucks), 0) AS used_trucks,
                COALESCE(SUM(a.allocated_buses), 0) AS used_buses
            FROM
                capacity_per_date cpd
            LEFT JOIN
                allocations a ON cpd.parking_lot_id = a.parking_lot_id AND cpd.date = a.date
            WHERE
                cpd.date BETWEEN :start_date AND :end_date
            GROUP BY
                cpd.date, cpd.parking_lot_id, cpd.capacity, cpd.truck_limit, cpd.bus_limit
        )
        SELECT
            c.date,
            c.parking_lot_id,
            pl.name AS parking_lot_name,
            c.capacity,
            c.truck_limit,
            c.bus_limit,
            c.used_capacity,
            c.used_cars,
            c.used_trucks,
            c.used_buses,
            c.capacity - c.used_capacity AS free_capacity
        FROM
            combined c
        JOIN
            public.parking_lot pl ON c.parking_lot_id = pl.id
        ORDER BY
            c.date, pl.name;
        """
        )

        df = pd.read_sql_query(
            query, db.engine, params={"start_date": start_date, "end_date": end_date}
        )
        parking_lot_capacities = df.to_dict(orient="records")

        return jsonify(parking_lot_capacities), 200
    except Exception as e:
        logger.error(e)
        return jsonify({"error": str(e)}), 500


@events_bp.route("/allocate_demands", methods=["POST"])
def allocate_demands():
    try:
        data = request.json
        allocations = data.get("allocations", [])
        event_id = data.get("event_id")

        if not event_id:
            return jsonify({"error": "Event ID must be provided"}), 400

        if allocations:
            allocations_df = pd.DataFrame(allocations)
            print("Received allocations:")
            print(allocations_df)

        delete_event_query = text(
            """
            DELETE FROM public.parking_lot_allocation
            WHERE event_id = :event_id
            """
        )
        db.session.execute(delete_event_query, {"event_id": event_id})

        if not allocations:
            db.session.commit()
            return (
                jsonify({"message": "All existing allocations deleted successfully"}),
                200,
            )

        for allocation in allocations:
            capacity_query = text(
                """
                SELECT capacity - COALESCE(SUM(allocated_capacity), 0) AS free_capacity
                FROM public.parking_lot_capacity pc
                LEFT JOIN public.parking_lot_allocation pa ON pc.parking_lot_id = pa.parking_lot_id AND pa.date = :date
                WHERE pc.parking_lot_id = :parking_lot_id AND :date BETWEEN pc.valid_from AND pc.valid_to
                GROUP BY pc.capacity
                """
            )
            result = db.session.execute(
                capacity_query,
                {
                    "parking_lot_id": allocation["parking_lot_id"],
                    "date": allocation["date"],
                },
            ).fetchone()

            if result is not None:
                free_capacity = result[
                    0
                ]  
            else:
                free_capacity = 0

            allocated_capacity = (
                allocation["allocated_cars"]
                + 4 * allocation["allocated_trucks"]
                + 3 * allocation["allocated_buses"]
            )

            if free_capacity < allocated_capacity:
                parking_lot_name_query = text(
                    """
                    SELECT name FROM public.parking_lot WHERE id = :parking_lot_id
                    """
                )
                parking_lot_name_result = db.session.execute(
                    parking_lot_name_query,
                    {"parking_lot_id": allocation["parking_lot_id"]},
                ).fetchone()
                parking_lot_name = (
                    parking_lot_name_result[0]
                    if parking_lot_name_result
                    else "Unknown Parking Lot"
                )

                return (
                    jsonify(
                        {
                            "error": f"Insufficient capacity for parking lot '{parking_lot_name}' on {allocation['date']}. Free capacity: {free_capacity}, Required: {allocated_capacity}"
                        }
                    ),
                    400,
                )

        for allocation in allocations:
            insert_query = text(
                """
                INSERT INTO public.parking_lot_allocation (
                    event_id, parking_lot_id, date, allocated_cars, allocated_trucks, allocated_buses
                ) VALUES (
                    :event_id, :parking_lot_id, :date, :allocated_cars, :allocated_trucks, :allocated_buses
                )
                """
            )
            db.session.execute(
                insert_query,
                {
                    "event_id": event_id,
                    "parking_lot_id": allocation["parking_lot_id"],
                    "date": allocation["date"],
                    "allocated_cars": allocation["allocated_cars"],
                    "allocated_trucks": allocation["allocated_trucks"],
                    "allocated_buses": allocation["allocated_buses"],
                },
            )

        db.session.commit()
        return jsonify({"message": "Allocations saved successfully"}), 201
    except Exception as e:
        logger.error(e)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@events_bp.route("/allocations", methods=["DELETE"])
def delete_allocations_for_dates():
    try:
        data = request.json
        event_id = data.get("event_id")
        dates = data.get("dates", [])

        if not event_id or not dates:
            return jsonify({"error": "Event ID and dates must be provided"}), 400

        delete_allocations_query = text(
            """
            DELETE FROM public.parking_lot_allocation
            WHERE event_id = :event_id AND date IN :dates
            """
        )
        db.session.execute(
            delete_allocations_query, {"event_id": event_id, "dates": tuple(dates)}
        )
        db.session.commit()
        return jsonify({"message": "Allocations deleted successfully"}), 200
    except Exception as e:
        logger.error(e)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
