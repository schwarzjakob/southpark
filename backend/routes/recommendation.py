
import pandas as pd
import requests
from datetime import datetime
from flask import Blueprint, request, jsonify
from extensions import db
from sqlalchemy import text
import logging


# Setup logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

recommendation_bp = Blueprint("recommendation", __name__)

# Define distances data

#distances
# Raw data as string
data = """
1,1,370
1,2,767
1,3,900
1,4,1010
1,5,1370
1,6,1436
1,7,1840
1,8,1920
1,9,2000
1,10,2086
1,11,962
1,12,982
1,13,1050
1,14,1120
1,15,1210
1,16,1370
1,17,1460
1,18,1620
1,19,1670
1,20,1830
2,1,120
2,2,472
2,3,574
2,4,566
2,5,918
2,6,1012
2,7,1430
2,8,1490
2,9,1570
2,10,1640
2,11,545
2,12,540
2,13,622
2,14,695
2,15,790
2,16,890
2,17,970
2,18,1050
2,19,1140
2,20,1420
3,1,631
3,2,50
3,3,50
3,4,171
3,5,526
3,6,597
3,7,1000
3,8,1080
3,9,1160
3,10,1240
3,11,143
3,12,151
3,13,213
3,14,280
3,15,540
3,16,611
3,17,650
3,18,742
3,19,750
3,20,997
4,1,946
4,2,378
4,3,270
4,4,151
4,5,180
4,6,261
4,7,658
4,8,736
4,9,812
4,10,896
4,11,485
4,12,365
4,13,265
4,14,221
4,15,226
4,16,209
4,17,294
4,18,325
4,19,439
4,20,680
5,1,1320
5,2,760
5,3,606
5,4,530
5,5,153
5,6,175
5,7,187
5,8,283
5,9,354
5,10,446
5,11,963
5,12,947
5,13,755
5,14,687
5,15,682
5,16,667
5,17,635
5,18,560
5,19,552
5,20,739
"""

lines = data.strip().split("\n")
values = [line.split(",") for line in lines]
distances_df = pd.DataFrame(values, columns=["entrance_id", "parking_lot_id", "distance"])
distances_df["entrance_id"] = distances_df["entrance_id"].astype(int)
distances_df["parking_lot_id"] = distances_df["parking_lot_id"].astype(int)
distances_df["distance"] = distances_df["distance"].astype(int)

TOTAL_CAPACITY_URL = "http://localhost:5000/dashboard/total_capacity"
PARKING_CAPACITIES_URL = "http://localhost:5000/parking/capacities/{}"
PARKING_SPACES_URL = "http://localhost:5000/parking/spaces"

def get_total_capacity(start_date, end_date):
    try:
        response = requests.get(TOTAL_CAPACITY_URL, params={'start_date': start_date, 'end_date': end_date})
        response.raise_for_status()
        capacities = response.json()
        if isinstance(capacities, list):
            min_capacity = min(capacity.get("total_capacity", 0) for capacity in capacities)
            return int(min_capacity)
        return 0
    except requests.exceptions.RequestException as e:
        return f"Error fetching total capacity: {str(e)}"
    except (KeyError, ValueError) as e:
        return f"Error parsing total capacity response: {str(e)}"

def check_parking_capacity(parking_lot_id, start_date, end_date):
    try:
        response = requests.get(PARKING_CAPACITIES_URL.format(parking_lot_id), params={'start_date': start_date, 'end_date': end_date})
        response.raise_for_status()
        capacities = response.json()
        if isinstance(capacities, list) and capacities:
            first_item = capacities[0]
            free_capacity = first_item.get('capacity', 0)
            return int(free_capacity) if isinstance(free_capacity, (int, float, str)) else 0
        return 0
    except requests.exceptions.RequestException as e:
        return f"Error fetching parking capacity: {str(e)}"
    except (KeyError, ValueError) as e:
        return f"Error parsing parking capacity response: {str(e)}"

def get_parking_lots(material=None, service_level=None):
    try:
        params = {}
        if material:
            params['material'] = material
        if service_level:
            params['service_level'] = service_level
        response = requests.get(PARKING_SPACES_URL, params=params)
        response.raise_for_status()
        parking_lots = response.json()
        if isinstance(parking_lots, list) and all(isinstance(lot, dict) and 'id' in lot for lot in parking_lots):
            return parking_lots
        else:
            return []
    except requests.exceptions.RequestException as e:
        return f"Error fetching parking lots: {str(e)}"

def assign_parking(lots, car_demand, bus_demand, truck_demand, phase, start_date, end_date):
    print(f"Assigning parking for {car_demand} cars, {bus_demand} busses, {truck_demand} trucks in {phase} phase")
    assigned_lots = {'cars': [], 'busses': [], 'trucks': []}
    remaining_demand = {'cars': car_demand, 'busses': bus_demand, 'trucks': truck_demand}
    
    for lot in lots:
        min_free_capacity = check_min_parking_capacity(lot['id'], start_date, end_date)
        min_free_capacity = int(min_free_capacity) if isinstance(min_free_capacity, (int, float, str)) else 0
        
        while min_free_capacity > 0 and (remaining_demand['cars'] > 0 or remaining_demand['busses'] > 0 or remaining_demand['trucks'] > 0):
            if remaining_demand['cars'] > 0 and min_free_capacity >= 1:
                allocated_capacity = min(min_free_capacity, remaining_demand['cars'])
                assigned_lots['cars'].append({'parking_lot_id': lot['id'], 'capacity': allocated_capacity})
                remaining_demand['cars'] -= allocated_capacity
                min_free_capacity -= allocated_capacity
            
            elif remaining_demand['busses'] > 0 and min_free_capacity >= 3:
                allocated_capacity = min(min_free_capacity // 3, remaining_demand['busses'])
                assigned_lots['busses'].append({'parking_lot_id': lot['id'], 'capacity': allocated_capacity})
                remaining_demand['busses'] -= allocated_capacity
                min_free_capacity -= allocated_capacity * 3
            
            elif remaining_demand['trucks'] > 0 and min_free_capacity >= 4:
                allocated_capacity = min(min_free_capacity // 4, remaining_demand['trucks'])
                assigned_lots['trucks'].append({'parking_lot_id': lot['id'], 'capacity': allocated_capacity})
                remaining_demand['trucks'] -= allocated_capacity
                min_free_capacity -= allocated_capacity * 4
            
            else:
                break
        
        if all(demand == 0 for demand in remaining_demand.values()):
            break
    
    if any(demand > 0 for demand in remaining_demand.values()):
        print(f"Error: Not enough capacity to fulfill {phase} demand")
        return f"Error: Not enough capacity to fulfill {phase} demand"
    
    for lot in assigned_lots['busses']:
        lot['capacity'] *= 3
    for lot in assigned_lots['trucks']:
        lot['capacity'] *= 4

    print(f"Assigned lots: {assigned_lots}")
    return assigned_lots

def recommendation_engine(event):
    recommendations = {}
    phases = ['assembly', 'runtime', 'disassembly']
    for phase in phases:
        print(f"Processing phase: {phase}")
        start_date = event[f'{phase}_start_date']
        end_date = event[f'{phase}_end_date']
        car_demand = int(event[f'{phase}_demand_cars'])
        bus_demand = int(event[f'{phase}_demand_busses'])
        truck_demand = int(event[f'{phase}_demand_trucks'])
        total_capacity = get_total_capacity(start_date, end_date)
        print(f"Total capacity for {phase} phase: {total_capacity}")
        if isinstance(total_capacity, str):
            print(f"Error: Total capacity returned as string: {total_capacity}")
            return f"Error: Total capacity returned as string: {total_capacity}"
        if (car_demand + bus_demand * 3 + truck_demand * 4) > total_capacity:
            print(f"Error: Demand for {phase} phase exceeds total capacity")
            return f"Error: Demand for {phase} phase exceeds total capacity"
        
        suitable_lots = get_parking_lots()
        phase_recommendations = assign_parking(suitable_lots, car_demand, bus_demand, truck_demand, phase, start_date, end_date)
        
        if isinstance(phase_recommendations, str):
            return phase_recommendations
        
        recommendations[phase] = phase_recommendations
    
    print(f"Recommendations: {recommendations}")
    return recommendations

def check_min_parking_capacity(parking_lot_id, start_date, end_date):
    try:
        print(f"Checking minimum parking capacity for lot {parking_lot_id} from {start_date} to {end_date}")
        response = requests.get(PARKING_CAPACITIES_URL.format(parking_lot_id), params={'start_date': start_date, 'end_date': end_date})
        response.raise_for_status()
        capacities = response.json()
        print(f"Capacities for lot {parking_lot_id}: {capacities}")
        if isinstance(capacities, list) and capacities:
            min_capacity = min(capacity.get('capacity', 0) for capacity in capacities)
            print(f"Minimum capacity: {min_capacity}")
            return int(min_capacity) if isinstance(min_capacity, (int, float, str)) else 0
        return 0
    except requests.exceptions.RequestException as e:
        print(f"Error fetching parking capacity: {str(e)}")
        return f"Error fetching parking capacity: {str(e)}"
    except (KeyError, ValueError) as e:
        print(f"Error parsing parking capacity response: {str(e)}")
        return f"Error parsing parking capacity response: {str(e)}"


def adjust_recommendations(recommendations):
    def adjust_capacity(vehicles, divisor):
        for vehicle in vehicles:
            vehicle['capacity'] = round(vehicle['capacity'] / divisor)

    for phase in ['assembly', 'disassembly', 'runtime']:
        if 'busses' in recommendations[phase]:
            adjust_capacity(recommendations[phase]['busses'], 3)
        if 'trucks' in recommendations[phase]:
            adjust_capacity(recommendations[phase]['trucks'], 4)
    return recommendations

@recommendation_bp.route("/engine", methods=["POST"])
def get_recommendations():
    try:
        event_id = request.json.get("id")
        if not event_id:
            return jsonify({"error": "Event ID is required"}), 400

        # Fetch event details from the database
        event_query = """
            SELECT 
                e.id, e.name, e.assembly_start_date, e.assembly_end_date, 
                e.runtime_start_date, e.runtime_end_date, e.disassembly_start_date, 
                e.disassembly_end_date,
                ARRAY(SELECT hall_id FROM hall_occupation WHERE event_id = e.id) AS hall_ids,
                COALESCE((SELECT MAX(car_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'assembly'), 0) AS assembly_demand_cars,
                COALESCE((SELECT MAX(bus_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'assembly'), 0) AS assembly_demand_busses,
                COALESCE((SELECT MAX(truck_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'assembly'), 0) AS assembly_demand_trucks,
                COALESCE((SELECT MAX(car_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'runtime'), 0) AS runtime_demand_cars,
                COALESCE((SELECT MAX(bus_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'runtime'), 0) AS runtime_demand_busses,
                COALESCE((SELECT MAX(truck_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'runtime'), 0) AS runtime_demand_trucks,
                COALESCE((SELECT MAX(car_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'disassembly'), 0) AS disassembly_demand_cars,
                COALESCE((SELECT MAX(bus_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'disassembly'), 0) AS disassembly_demand_busses,
                COALESCE((SELECT MAX(truck_demand) FROM visitor_demand WHERE event_id = e.id AND status = 'disassembly'), 0) AS disassembly_demand_trucks
            FROM event e
            WHERE e.id = :event_id
        """

        entrance_query = """
            SELECT 
                ARRAY(SELECT entrance_id FROM entrance_occupation WHERE event_id = :event_id) AS entrance_ids
        """

        event = db.session.execute(text(event_query), {"event_id": event_id}).fetchone()
        entrance = db.session.execute(text(entrance_query), {"event_id": event_id}).fetchone()

        if not event:
            return jsonify({"error": "Event not found"}), 404

        # Convert the event data to a dictionary
        event_data = {
            "id": event.id,
            "name": event.name,
            "assembly_start_date": event.assembly_start_date,
            "assembly_end_date": event.assembly_end_date,
            "runtime_start_date": event.runtime_start_date,
            "runtime_end_date": event.runtime_end_date,
            "disassembly_start_date": event.disassembly_start_date,
            "disassembly_end_date": event.disassembly_end_date,
            "entrance_ids": entrance.entrance_ids,
            "hall_ids": event.hall_ids,
            "assembly_demand_cars": event.assembly_demand_cars,
            "assembly_demand_busses": event.assembly_demand_busses,
            "assembly_demand_trucks": event.assembly_demand_trucks,
            "runtime_demand_cars": event.runtime_demand_cars,
            "runtime_demand_busses": event.runtime_demand_busses,
            "runtime_demand_trucks": event.runtime_demand_trucks,
            "disassembly_demand_cars": event.disassembly_demand_cars,
            "disassembly_demand_busses": event.disassembly_demand_busses,
            "disassembly_demand_trucks": event.disassembly_demand_trucks,
        }

        # Log the event data
        logger.info("Event Data: %s", event_data)
        print(f"Event Data: {event_data}")

        # Call the recommendation engine with the event data
        recommendations = recommendation_engine(event_data)
        recommendations_adjusted = adjust_recommendations(recommendations)

        return jsonify(recommendations_adjusted), 200
    except Exception as e:
        logger.error("Error in get_recommendations: %s", str(e))
        print(f"Error in get_recommendations: {str(e)}")
        return jsonify({"error": str(e)}), 500
