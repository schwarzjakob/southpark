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

# Configuration
run_all_allocations = (
    False  # Set to True to run all allocations, False to run only remaining allocations
)
specific_event_ids = (
    []
)  # List of specific event IDs to run (seperate, by comma), empty means all/remaining depending on run_all_allocations


def fetch_remaining_event_ids():
    query = """
        SELECT DISTINCT v.event_id
        FROM public.visitor_demand v
        LEFT JOIN (
            SELECT event_id, date, SUM(allocated_capacity) AS total_allocated_capacity
            FROM public.parking_lot_allocation
            GROUP BY event_id, date
        ) pa ON v.event_id = pa.event_id AND v.date = pa.date
        WHERE v.demand != COALESCE(pa.total_allocated_capacity, 0);
    """
    remaining_events = get_data(query).to_dict(orient="records")
    return [event["event_id"] for event in remaining_events]


def fetch_all_events(event_ids=None):
    if event_ids:
        event_condition = f"WHERE e.id IN ({', '.join(map(str, event_ids))})"
    else:
        event_condition = ""

    query = f"""
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
        {event_condition}
    """
    events = get_data(query).to_dict(orient="records")
    return events


def generate_recommendations(event_data):
    from routes.recommendation import recommendation_engine, adjust_recommendations

    recommendations = recommendation_engine(event_data)
    recommendations_adjusted = adjust_recommendations(recommendations)
    logger.info(
        f"Generated recommendations for event {event_data['name']} (ID: {event_data['id']})"
    )
    return recommendations_adjusted


def fetch_daily_demands(event_id, start_date, end_date, phase):
    query = f"""
        SELECT date, car_demand, bus_demand, truck_demand
        FROM visitor_demand
        WHERE event_id = {event_id} AND status = '{phase}' AND date BETWEEN '{start_date}' AND '{end_date}'
    """
    demands = get_data(query).to_dict(orient="records")
    return {d["date"].strftime("%Y-%m-%d"): d for d in demands}


def apply_recommendations(event_data, recommendations):
    allocations = []
    total_demands = {}

    def add_allocation(date, vehicle_type, demand, capacities):
        remaining_demand = demand
        for item in capacities:
            if remaining_demand <= 0:
                break

            allocation = next(
                (
                    a
                    for a in allocations
                    if a["parking_lot_id"] == item["parking_lot_id"]
                    and a["date"] == date.strftime("%Y-%m-%d")
                ),
                None,
            )
            if not allocation:
                allocation = {
                    "event_id": event_data["id"],
                    "parking_lot_id": item["parking_lot_id"],
                    "date": date.strftime("%Y-%m-%d"),
                    "allocated_cars": 0,
                    "allocated_trucks": 0,
                    "allocated_buses": 0,
                }
                allocations.append(allocation)

            available_capacity = item["capacity"]
            if vehicle_type == "cars":
                current_allocation = allocation["allocated_cars"]
            elif vehicle_type == "trucks":
                current_allocation = allocation["allocated_trucks"]
            elif vehicle_type == "buses":
                current_allocation = allocation["allocated_buses"]

            capacity_to_allocate = min(
                available_capacity - current_allocation, remaining_demand
            )
            remaining_demand -= capacity_to_allocate

            if vehicle_type == "cars":
                allocation["allocated_cars"] += capacity_to_allocate
            elif vehicle_type == "trucks":
                allocation["allocated_trucks"] += capacity_to_allocate
            elif vehicle_type == "buses":
                allocation["allocated_buses"] += capacity_to_allocate

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
        daily_demands = fetch_daily_demands(
            event_data["id"],
            phase_dates[phase]["start_date"],
            phase_dates[phase]["end_date"],
            phase,
        )
        for date in pd.date_range(
            phase_dates[phase]["start_date"], phase_dates[phase]["end_date"]
        ):
            date_str = date.strftime("%Y-%m-%d")
            if date_str in daily_demands:
                demand = daily_demands[date_str]
                total_demands[date_str] = (
                    demand["car_demand"]
                    + demand["bus_demand"] * 3
                    + demand["truck_demand"] * 4
                )
                add_allocation(
                    date, "cars", demand["car_demand"], recommendations[phase]["cars"]
                )
                add_allocation(
                    date,
                    "trucks",
                    demand["truck_demand"],
                    recommendations[phase]["trucks"],
                )
                add_allocation(
                    date, "buses", demand["bus_demand"], recommendations[phase]["buses"]
                )

    return allocations, total_demands


def save_allocations_to_db(allocations, current_event, total_events):
    try:
        # Delete existing allocations for the event being processed
        if allocations:
            delete_query = text(
                """
                DELETE FROM public.parking_lot_allocation
                WHERE event_id = :event_id
                """
            )
            db.session.execute(delete_query, {"event_id": allocations[0]["event_id"]})

        for allocation in allocations:
            allocation["allocated_cars"] = int(allocation["allocated_cars"])
            allocation["allocated_trucks"] = int(allocation["allocated_trucks"])
            allocation["allocated_buses"] = int(allocation["allocated_buses"])

            # Insert new allocation
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
        logger.info(f"Allocations saved successfully ({current_event}/{total_events})")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving allocations: {e}")


def log_allocation_dataframe(event_data, allocations, total_demands):
    df = pd.DataFrame(allocations)
    df_summary = df.groupby("date").sum()[
        ["allocated_cars", "allocated_trucks", "allocated_buses"]
    ]
    df_summary["total_allocated"] = (
        df_summary["allocated_cars"]
        + df_summary["allocated_trucks"] * 4
        + df_summary["allocated_buses"] * 3
    )
    df_summary.reset_index(inplace=True)
    df_summary["total_demand"] = df_summary["date"].map(total_demands)

    logger.info(
        f"\n{event_data['name']} ({event_data['id']}) Allocation Summary:\n{df_summary}"
    )


@allocation_bp.route("/allocate", methods=["POST"])
def allocate_parking_spaces():
    try:
        if specific_event_ids:
            event_ids = specific_event_ids
        elif run_all_allocations:
            event_ids = None  # Fetch all events
        else:
            event_ids = fetch_remaining_event_ids()  # Fetch remaining events

        events = fetch_all_events(event_ids)
        total_events = len(events)
        for i, event in enumerate(events, start=1):
            logger.info(f"Processing event: {event['name']} (ID: {event['id']})")
            recommendations = generate_recommendations(event)
            allocations, total_demands = apply_recommendations(event, recommendations)
            if allocations:
                log_allocation_dataframe(event, allocations, total_demands)
                save_allocations_to_db(allocations, i, total_events)
            else:
                logger.warning(f"No allocations generated for event {event['id']}")
        return jsonify({"message": "Allocation process completed successfully"}), 200
    except Exception as e:
        logger.error(f"Error running allocation: {e}")
        return jsonify({"error": str(e)}), 500
