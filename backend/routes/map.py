import logging
from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from utils.helpers import get_data
from flask_caching import Cache

map_bp = Blueprint("map", __name__)
logger = logging.getLogger(__name__)

@map_bp.route("/coordinates", methods=["GET"])
def get_coordinates():
    try:
        query_halls = """
        SELECT id, name, coordinates
        FROM public.hall
        """
        df_halls = get_data(query_halls)
        halls_data = df_halls.to_dict(orient="records") if not df_halls.empty else []

        query_parking_lots = """
        SELECT id, name, coordinates
        FROM public.parking_lot
        """
        df_parking_lots = get_data(query_parking_lots)
        parking_lots_data = (
            df_parking_lots.to_dict(orient="records")
            if not df_parking_lots.empty
            else []
        )

        query_entrances = """
        SELECT id, name, coordinates
        FROM public.entrance
        """
        df_entrances = get_data(query_entrances)
        entrances_data = (
            df_entrances.to_dict(orient="records") if not df_entrances.empty else []
        )

        data = {
            "halls": halls_data,
            "parking_lots": parking_lots_data,
            "entrances": entrances_data,
        }

        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@map_bp.route("/events_timeline/<date>", methods=["GET"])
def get_events_timeline(date):
    try:
        date = datetime.strptime(date, "%Y-%m-%d")
        start_date = date - timedelta(days=45)
        end_date = date + timedelta(days=45)

        query = f"""
        SELECT * FROM view_schema.view_events_timeline
        WHERE
            (disassembly_end_date >= '{start_date}' AND assembly_start_date <= '{end_date}')
        """
        df_events_timeline = get_data(query)
        events_timeline = (
            df_events_timeline.to_dict(orient="records")
            if not df_events_timeline.empty
            else []
        )

        return jsonify(events_timeline), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@map_bp.route("/parking_lots_capacity/<date>", methods=["GET"])
def get_parking_lot_capacity(date):
    """
    Endpoint to retrieve parking lot capacity data for a specific date.
    """
    try:
        date = datetime.strptime(date, "%Y-%m-%d").date()
        logger.info(
            f"Fetching parking lot capacity data from the database for date: {date}"
        )

        query_parking_lots = f"""
        SELECT
            pl.id,
            pl.name AS name,
            pl.external AS external,
            plc.capacity AS capacity
        FROM
            public.parking_lot pl
            JOIN public.parking_lot_capacity plc ON pl.id = plc.parking_lot_id
        WHERE
            plc.valid_from <= '{date}'
            AND plc.valid_to >= '{date}'
            AND plc.utilization_type = 'parking'
        ORDER BY
            pl.id;
        """

        df_parking_lots = get_data(query_parking_lots)
        if df_parking_lots.empty:
            logger.info(f"No data available for parking lots on date: {date}")
            return jsonify({"message": "No data found"}), 204

        logger.info(f"Parking lot capacity data fetched successfully for date: {date}")

        parking_lots_data = df_parking_lots.to_dict(orient="records")
        return jsonify(parking_lots_data), 200
    except Exception as e:
        logger.error("Failed to fetch parking lot capacity data", exc_info=True)
        return jsonify({"error": str(e)}), 500


@map_bp.route("/parking_occupancy/<date>", methods=["GET"])
def get_parking_lot_occupancy(date):
    """
    Endpoint to retrieve parking lot occupancy data for a specific date.
    """
    try:
        # Parse the date from the URL
        date = datetime.strptime(date, "%Y-%m-%d").date()

        logger.info(
            f"Fetching parking lot occupancy data from the database for date: {date}"
        )

        # Define the query to fetch occupancy data
        query_occupancy = f"""
        SELECT
            vd.date,
            vd.parking_lot_name,
            vd.occupied_capacity AS occupancy,
            vd.free_capacity,
            truck_limit,
            bus_limit
        FROM view_schema.view_daily_parking_lot_capacity_and_occupation vd
        WHERE vd.date = '{date}'
        """

        logger.info(f"Executing query: {query_occupancy}")

        # Execute the query and get the data
        df_occupancy = get_data(query_occupancy)

        # Check if the data is empty and return appropriate response
        if df_occupancy.empty:
            logger.info(f"No data available for parking lot occupancy on date: {date}")
            return jsonify("No data"), 200

        logger.info(f"Parking lot occupancy data fetched successfully for date: {date}")

        # Convert the DataFrame to a dictionary and return it as JSON
        occupancy_data = df_occupancy.to_dict(orient="records")
        return jsonify(occupancy_data), 200

    except Exception as e:
        # Log the exception and return an error response
        logger.error("Failed to fetch parking lot occupancy data", exc_info=True)
        return jsonify({"error": str(e)}), 500

@map_bp.route("/map_data/<date>", methods=["GET"])
def get_map_data(date):
    try:
        logging.debug(f"Received request for map data on date: {date}")
        date = datetime.strptime(date, "%Y-%m-%d")
        start_date = date - timedelta(days=45)
        end_date = date + timedelta(days=45)

        # Caching mechanism to check if data is already cached
        cache_key = f"map_data_{date}"
        from app import cache  # Delayed import to avoid circular import
        cached_data = cache.get(cache_key)
        if cached_data:
            logging.debug(f"Cache hit for key: {cache_key}")
            return jsonify(cached_data), 200
        logging.debug(f"Cache miss for key: {cache_key}")

        # Fetch halls, parking lots, and entrances
        query_coordinates = """
        SELECT 'hall' AS type, id, name, coordinates FROM public.hall
        UNION ALL
        SELECT 'parking_lot' AS type, id, name, coordinates FROM public.parking_lot
        UNION ALL
        SELECT 'entrance' AS type, id, name, coordinates FROM public.entrance
        """
        df_coordinates = get_data(query_coordinates)
        coordinates_data = df_coordinates.to_dict(orient="records") if not df_coordinates.empty else []
        logging.debug(f"Fetched coordinates data: {coordinates_data}")

        # Fetch events timeline
        query_events = f"""
        SELECT * FROM public.event
        WHERE
            (disassembly_end_date >= '{start_date}' AND assembly_start_date <= '{end_date}')
        """
        df_events_timeline = get_data(query_events)
        events_timeline = df_events_timeline.to_dict(orient="records") if not df_events_timeline.empty else []
        logging.debug(f"Fetched events timeline: {events_timeline}")

        # Fetch parking lots capacity
        query_parking_capacity = f"""
        SELECT
            pl.id,
            pl.name,
            pl.external,
            plc.capacity
        FROM
            public.parking_lot pl
            JOIN public.parking_lot_capacity plc ON pl.id = plc.parking_lot_id
        WHERE
            plc.valid_from <= '{date}' AND plc.valid_to >= '{date}' AND plc.utilization_type = 'parking'
        ORDER BY
            pl.id;
        """
        df_parking_capacity = get_data(query_parking_capacity)
        parking_capacity_data = df_parking_capacity.to_dict(orient="records") if not df_parking_capacity.empty else []
        logging.debug(f"Fetched parking capacity data: {parking_capacity_data}")

        # Fetch parking lots occupancy
        query_parking_occupancy = f"""
        SELECT
            vd.date,
            vd.parking_lot_name,
            vd.occupied_capacity AS occupancy,
            vd.free_capacity,
            truck_limit,
            bus_limit
        FROM view_schema.view_daily_parking_lot_capacity_and_occupation vd
        WHERE vd.date = '{date}'
        """
        df_parking_occupancy = get_data(query_parking_occupancy)
        parking_occupancy_data = df_parking_occupancy.to_dict(orient="records") if not df_parking_occupancy.empty else []
        logging.debug(f"Fetched parking occupancy data: {parking_occupancy_data}")

        data = {
            "coordinates": coordinates_data,
            "events_timeline": events_timeline,
            "parking_capacity": parking_capacity_data,
            "parking_occupancy": parking_occupancy_data,
        }

        # Cache the data for future requests
        cache.set(cache_key, data, timeout=300)  # Cache timeout in seconds
        logging.debug(f"Cached data for key: {cache_key}")

        return jsonify(data), 200
    except Exception as e:
        logging.error(f"Error fetching map data: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500
