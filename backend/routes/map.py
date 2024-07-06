import logging
from datetime import datetime, timedelta

from flask import Blueprint, jsonify
from utils.helpers import get_data

map_bp = Blueprint("map", __name__)
logger = logging.getLogger(__name__)

@map_bp.route("/map_data/<date>", methods=["GET"])
def get_map_data(date):
    try:
        date = datetime.strptime(date, "%Y-%m-%d").date()
        start_date = date - timedelta(days=365)
        end_date = date + timedelta(days=365)

        query_events_timeline = f"""
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
            (e.disassembly_end_date >= '{start_date}' AND e.assembly_start_date <= '{end_date}')
        GROUP BY 
            e.event_id, e.assembly_start_date, e.assembly_end_date, e.runtime_start_date, e.runtime_end_date, e.disassembly_start_date, e.disassembly_end_date, e.early_assembly_start_date, e.early_assembly_end_date, e.late_disassembly_start_date, e.late_disassembly_end_date, e.event_color, e.event_name, e.halls
        """
        print("Executing query_events_timeline:", query_events_timeline)
        df_events_timeline = get_data(query_events_timeline)
        print("Query result:", df_events_timeline)
        events_timeline = df_events_timeline.to_dict(orient="records")

        query_parking_lots_capacity = f"""
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
            generate_series('{start_date}', '{end_date}', '1 day'::interval) AS dates(date)
        WHERE 
            plc.valid_from <= dates.date AND plc.valid_to >= dates.date AND plc.utilization_type = 'parking'
        ORDER BY 
            pl.id, dates.date;
        """
        print("Executing query_parking_lots_capacity:", query_parking_lots_capacity)
        df_parking_lots_capacity = get_data(query_parking_lots_capacity)
        print("Query result:", df_parking_lots_capacity)
        parking_lots_capacity = df_parking_lots_capacity.to_dict(orient="records")

        query_parking_lots_occupancy = f"""
        SELECT 
            pa.date, 
            pl.name AS parking_lot_name, 
            SUM(pa.allocated_capacity) AS occupancy
        FROM 
            public.parking_lot_allocation pa
        JOIN 
            public.parking_lot pl ON pa.parking_lot_id = pl.id
        WHERE 
            pa.date BETWEEN '{start_date}' AND '{end_date}'
        GROUP BY 
            pa.date, pl.name
        ORDER BY 
            pa.date, pl.name;
        """
        print("Executing query_parking_lots_occupancy:", query_parking_lots_occupancy)
        df_parking_lots_occupancy = get_data(query_parking_lots_occupancy)
        print("Query result:", df_parking_lots_occupancy)
        parking_lots_occupancy = df_parking_lots_occupancy.to_dict(orient="records")

        query_parking_lots_allocations = f"""
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
            pa.date BETWEEN '{start_date}' AND '{end_date}'
        ORDER BY 
            pa.parking_lot_id, pa.event_id, pa.date;
        """
        print("Executing query_parking_lots_allocations:", query_parking_lots_allocations)
        df_parking_lots_allocations = get_data(query_parking_lots_allocations)
        print("Query result:", df_parking_lots_allocations)
        parking_lots_allocations = df_parking_lots_allocations.to_dict(orient="records")

        query_halls = "SELECT id, name, coordinates FROM public.hall"
        print("Executing query_halls:", query_halls)
        df_halls = get_data(query_halls)
        print("Query result:", df_halls)
        halls_data = df_halls.to_dict(orient="records")

        query_parking_lots = "SELECT id, name, coordinates FROM public.parking_lot"
        print("Executing query_parking_lots:", query_parking_lots)
        df_parking_lots = get_data(query_parking_lots)
        print("Query result:", df_parking_lots)
        parking_lots_data = df_parking_lots.to_dict(orient="records")

        query_entrances = "SELECT id, name, coordinates FROM public.entrance"
        print("Executing query_entrances:", query_entrances)
        df_entrances = get_data(query_entrances)
        print("Query result:", df_entrances)
        entrances_data = df_entrances.to_dict(orient="records")

        data = {
            "events_timeline": events_timeline,
            "parking_lots_capacity": parking_lots_capacity,
            "parking_lots_occupancy": parking_lots_occupancy,
            "parking_lots_allocations": parking_lots_allocations,
            "coordinates": {
                "halls": halls_data,
                "parking_lots": parking_lots_data,
                "entrances": entrances_data,
            },
        }

        return jsonify(data), 200
    except Exception as e:
        print("Error occurred:", str(e))
        return jsonify({"error": str(e)}), 500