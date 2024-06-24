from flask import Blueprint, jsonify, request
from utils.helpers import get_data
from datetime import datetime, timedelta
import logging

data_bp = Blueprint('data', __name__)
logger = logging.getLogger(__name__)

@data_bp.route("/events_parking_lots_allocation", methods=["GET"])
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


@data_bp.route("/search", methods=["GET"])
def search():
    """
    Endpoint to search for events and parking spaces by name.
    Fetches data from the 'event' and 'parking_lot' tables in the database.

    Returns:
        JSON response with the fetched data or an error message if an exception is raised.
    """
    try:
        query_param = request.args.get("q", "")
        if not query_param:
            return jsonify([])

        logger.info("Searching for events and parking spaces matching query: %s", query_param)
        search_query = """
        SELECT 'event' AS type, id, name, color, assembly_start_date, disassembly_end_date
        FROM event
        WHERE name ILIKE :query
        UNION ALL
        SELECT 'parking_lot' AS type, id, name, '#6a91ce' AS color, NULL AS assembly_start_date, NULL AS disassembly_end_date
        FROM parking_lot
        WHERE name ILIKE :query
        """

        results = get_data(search_query, {"query": f"%{query_param}%"})
        if results.empty:
            logger.info("No matching data found.")
            return jsonify({"message": "No data found"}), 204

        logger.info("Search results fetched successfully.")
        return jsonify(results.to_dict(orient="records")), 200
    except Exception as e:
        logger.error("Failed to fetch search results from database", exc_info=True)
        return jsonify({"error": str(e)}), 500