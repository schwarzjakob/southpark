import pandas as pd
from sqlalchemy import text
from datetime import datetime
from flask import Blueprint, jsonify
from extensions import db
from utils.helpers import get_data
import logging

# Setup logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

allocation_bp = Blueprint("allocation", __name__)


def fetch_all_events():
    query = """
        SELECT e.id, e.name, e.assembly_start_date, e.assembly_end_date, e.runtime_start_date, e.runtime_end_date, e.disassembly_start_date, e.disassembly_end_date,
        ARRAY(SELECT hall_id FROM hall_occupation WHERE event_id = e.id) AS hall_ids,
        COALESCE((SELECT MAX(car_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'assembly'), 0) AS assembly_demand_cars,
        COALESCE((SELECT MAX(bus_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'assembly'), 0) AS assembly_demand_buses,
        COALESCE((SELECT MAX(truck_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'assembly'), 0) AS assembly_demand_trucks,
        COALESCE((SELECT MAX(car_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'runtime'), 0) AS runtime_demand_cars,
        COALESCE((SELECT MAX(bus_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'runtime'), 0) AS runtime_demand_buses,
        COALESCE((SELECT MAX(truck_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'runtime'), 0) AS runtime_demand_trucks,
        COALESCE((SELECT MAX(car_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'disassembly'), 0) AS disassembly_demand_cars,
        COALESCE((SELECT MAX(bus_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'disassembly'), 0) AS disassembly_demand_buses,
        COALESCE((SELECT MAX(truck_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'disassembly'), 0) AS disassembly_demand_trucks
        FROM event e
    """
    events = get_data(query).to_dict(orient="records")
    return events


def generate_recommendations(event_data):
    from routes.recommendation import recommendation_engine, adjust_recommendations

    recommendations = recommendation_engine(event_data)
    recommendations_adjusted = adjust_recommendations(recommendations)
    return recommendations_adjusted


def apply_recommendations(event_data, recommendations):
    allocations = []

    def add_allocation(phase, vehicle_type):
        for item in recommendations[phase].get(vehicle_type, []):
            allocation = {
                "event_id": event_data["id"],
                "parking_lot_id": item["parking_lot_id"],
                "date": date.strftime("%Y-%m-%d"),
                "allocated_cars": 0,
                "allocated_trucks": 0,
                "allocated_buses": 0,
            }
            if vehicle_type == "cars":
                allocation["allocated_cars"] = int(item["capacity"])
            elif vehicle_type == "trucks":
                allocation["allocated_trucks"] = int(item["capacity"])
            elif vehicle_type == "buses":
                allocation["allocated_buses"] = int(item["capacity"])
            allocations.append(allocation)

    phase_dates = {
        "assembly": {
            "start_date": event_data["assembly_start_date"],
            "end_date": event_data["assembly_end_date"],
        },
        "runtime": {
            "start_date": event_data["runtime_start_date"],
            "end_date": event_data["runtime_end_date"],
        },
        "disassembly": {
            "start_date": event_data["disassembly_start_date"],
            "end_date": event_data["disassembly_end_date"],
        },
    }

    for phase in ["assembly", "runtime", "disassembly"]:
        for date in pd.date_range(
            phase_dates[phase]["start_date"], phase_dates[phase]["end_date"]
        ):
            add_allocation(phase, "cars")
            add_allocation(phase, "trucks")
            add_allocation(phase, "buses")

    return allocations


def save_allocations_to_db(allocations):
    try:
        for allocation in allocations:
            allocation["allocated_cars"] = int(allocation["allocated_cars"])
            allocation["allocated_trucks"] = int(allocation["allocated_trucks"])
            allocation["allocated_buses"] = int(allocation["allocated_buses"])

            insert_query = text(
                """
                INSERT INTO public.parking_lot_allocation (
                    event_id, parking_lot_id, date, allocated_cars, allocated_trucks, allocated_buses
                ) VALUES (
                    :event_id, :parking_lot_id, :date, :allocated_cars, :allocated_trucks, :allocated_buses
                )
                ON CONFLICT (event_id, parking_lot_id, date) 
                DO UPDATE SET 
                    allocated_cars = EXCLUDED.allocated_cars,
                    allocated_trucks = EXCLUDED.allocated_trucks,
                    allocated_buses = EXCLUDED.allocated_buses
                """
            )
            db.session.execute(insert_query, allocation)

        db.session.commit()
        logger.info("Allocations saved successfully")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving allocations: {e}")


@allocation_bp.route("/allocate", methods=["POST"])
def allocate_parking_spaces():
    try:
        events = fetch_all_events()
        for event in events:
            logger.info(f"Processing event: {event['name']} (ID: {event['id']})")
            recommendations = generate_recommendations(event)
            allocations = apply_recommendations(event, recommendations)
            save_allocations_to_db(allocations)
            logger.info(f"Allocations for event {event['name']} completed")
        return jsonify({"message": "Allocation process completed successfully"}), 200
    except Exception as e:
        logger.error(f"Error running allocation: {e}")
        return jsonify({"error": str(e)}), 500
