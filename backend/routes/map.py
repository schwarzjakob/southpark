
import logging
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor
from flask import Blueprint, jsonify, current_app as app
from utils.helpers import get_data
from flask import current_app as app

map_bp = Blueprint("map", __name__)
logger = logging.getLogger(__name__)

def fetch_data_in_context(query, params):
    with app.app_context():
        return get_data(query, params).to_dict(orient="records")

@map_bp.route("/map_data/<date>", methods=["GET"])
def get_map_data(date):
    with app.app_context():
        try:
            date = datetime.strptime(date, "%Y-%m-%d").date()
            start_date = date - timedelta(days=365)
            end_date = date + timedelta(days=365)

            query_events_timeline = """
            SELECT 
                e.event_id,
                e.assembly_start_date,
                e.assembly_end_date,
                e.runtime_start_date,
                e.runtime_end_date,
                e.disassembly_start_date,
                e.disassembly_end_date,
                e.early_assembly_start_date,
                e.early_assembly_end_date,
                e.late_disassembly_start_date,
                e.late_disassembly_end_date,
                e.event_color,
                e.event_name,
                e.halls,
                STRING_AGG(DISTINCT eo.entrance_id::text, ', ') AS event_entrance
            FROM 
                view_schema.view_events_timeline e
            LEFT JOIN 
                public.entrance_occupation eo ON e.event_id = eo.event_id
            WHERE 
                (e.disassembly_end_date >= %s AND e.assembly_start_date <= %s)
            GROUP BY 
                e.event_id, e.assembly_start_date, e.assembly_end_date, e.runtime_start_date, e.runtime_end_date, e.disassembly_start_date, e.disassembly_end_date, e.early_assembly_start_date, e.early_assembly_end_date, e.late_disassembly_start_date, e.late_disassembly_end_date, e.event_color, e.event_name, e.halls
            """
            
            query_parking_lots_capacity = """
            SELECT 
                pl.id, 
                pl.name AS name, 
                pl.external AS external, 
                plc.capacity AS capacity,
                dates.date
            FROM 
                public.parking_lot pl
            JOIN 
                public.parking_lot_capacity plc ON pl.id = plc.parking_lot_id
            CROSS JOIN 
                generate_series(%s, %s, '1 day'::interval) AS dates(date)
            WHERE 
                plc.valid_from <= dates.date AND plc.valid_to >= dates.date AND plc.utilization_type = 'parking'
            ORDER BY 
                pl.id, dates.date;
            """
            
            query_parking_lots_occupancy = """
            SELECT 
                pa.date, 
                pl.name AS parking_lot_name, 
                SUM(pa.allocated_capacity) AS occupancy
            FROM 
                public.parking_lot_allocation pa
            JOIN 
                public.parking_lot pl ON pa.parking_lot_id = pl.id
            WHERE 
                pa.date BETWEEN %s AND %s
            GROUP BY 
                pa.date, pl.name
            ORDER BY 
                pa.date, pl.name;
            """
            
            query_parking_lots_allocations = """
            SELECT 
                pa.parking_lot_id, 
                pl.name AS parking_lot_name, 
                pa.event_id, 
                e.name AS event_name, 
                e.color AS event_color, 
                pa.allocated_capacity, 
                pa.date
            FROM 
                public.parking_lot_allocation pa
            JOIN 
                public.parking_lot pl ON pa.parking_lot_id = pl.id
            JOIN 
                public.event e ON pa.event_id = e.id
            WHERE 
                pa.date BETWEEN %s AND %s
            ORDER BY 
                pa.parking_lot_id, pa.event_id, pa.date;
            """
            
            query_halls = "SELECT id, name, coordinates FROM public.hall"
            query_parking_lots = "SELECT id, name, coordinates FROM public.parking_lot"
            query_entrances = "SELECT id, name, coordinates FROM public.entrance"
        
            with ThreadPoolExecutor() as executor:
                events_timeline = executor.submit(fetch_data_in_context, query_events_timeline, (start_date, end_date))
                parking_lots_capacity = executor.submit(fetch_data_in_context, query_parking_lots_capacity, (start_date, end_date))
                parking_lots_occupancy = executor.submit(fetch_data_in_context, query_parking_lots_occupancy, (start_date, end_date))
                parking_lots_allocations = executor.submit(fetch_data_in_context, query_parking_lots_allocations, (start_date, end_date))
                halls_data = executor.submit(fetch_data_in_context, query_halls, ())
                parking_lots_data = executor.submit(fetch_data_in_context, query_parking_lots, ())
                entrances_data = executor.submit(fetch_data_in_context, query_entrances, ())
                        
            data = {
                "events_timeline": events_timeline.result(),
                "parking_lots_capacity": parking_lots_capacity.result(),
                "parking_lots_occupancy": parking_lots_occupancy.result(),
                "parking_lots_allocations": parking_lots_allocations.result(),
                "coordinates": {
                    "halls": halls_data.result(),
                    "parking_lots": parking_lots_data.result(),
                    "entrances": entrances_data.result(),
                },
            }
            
            return jsonify(data), 200
        except Exception as e:
            logger.error("Error occurred: %s", str(e))
            return jsonify({"error": str(e)}), 500