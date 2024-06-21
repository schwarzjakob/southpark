import os
import logging
from flask import Blueprint, jsonify, request
from sqlalchemy import text
from datetime import datetime, timedelta
from extensions import db
from utils.helpers import get_data, parse_date, calculate_date_range
from scripts.allocation_algorithm import fetch_and_optimize_parking_lots
from sqlalchemy import create_engine, text

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
