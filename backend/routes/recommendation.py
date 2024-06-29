

import pandas as pd
import requests
from datetime import datetime, timedelta
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

# Define the list of west halls for parking house hard assignment
west_halls = [1, 2, 3, 7, 8, 9, 13, 14, 15]

# Split the raw data string into lines and then into individual values
lines = data.strip().split("\n")
values = [line.split(",") for line in lines]

# Create a DataFrame from the values
distances_df = pd.DataFrame(values, columns=["entrance_id", "parking_lot_id", "distance"])
# Convert the columns to the appropriate data types
distances_df["entrance_id"] = distances_df["entrance_id"].astype(int)
distances_df["parking_lot_id"] = distances_df["parking_lot_id"].astype(int)
distances_df["distance"] = distances_df["distance"].astype(int)




def get_total_capacity(start_date, end_date):
    try:
        logger.info(f"Fetching total capacity from {start_date} to {end_date}")
        query = """
        SELECT id, parking_lot_id, capacity, valid_from, valid_to
        FROM public.parking_lot_capacity
        """
        result = db.session.execute(text(query))
        capacity_data = result.fetchall()

        total_capacities = []
        current_date = start_date
        while current_date <= end_date:
            total_capacity = sum(
                entry[2]  # Using index 2 for 'capacity'
                for entry in capacity_data
                if entry[3] <= current_date <= entry[4]  # Using indexes 3 and 4 for 'valid_from' and 'valid_to'
            )
            total_capacities.append(
                {
                    "day": current_date.strftime("%Y-%m-%d"),
                    "total_capacity": total_capacity,
                }
            )
            current_date += timedelta(days=1)

        logger.info(f"Total capacities: {total_capacities}")
        return total_capacities
    except Exception as e:
        logger.error(f"Error fetching total capacity: {str(e)}")
        return f"Error fetching total capacity: {str(e)}"

def check_parking_capacity(parking_lot_id, start_date, end_date):
    try:
        logger.info(f"Checking parking capacity for lot {parking_lot_id} from {start_date} to {end_date}")
        query = """
        SELECT capacity, truck_limit, bus_limit, valid_from, valid_to
        FROM public.parking_lot_capacity
        WHERE parking_lot_id = :parking_lot_id
        """
        result = db.session.execute(text(query), {"parking_lot_id": parking_lot_id})
        capacities = result.fetchall()

        min_capacity = float('inf')
        min_truck_limit = float('inf')
        min_bus_limit = float('inf')

        for capacity in capacities:
            if capacity[3] <= end_date and capacity[4] >= start_date:
                min_capacity = min(min_capacity, int(capacity[0]))  # Convert capacity to int
                min_truck_limit = min(min_truck_limit, int(capacity[1]))  # Convert truck_limit to int
                min_bus_limit = min(min_bus_limit, int(capacity[2]))  # Convert bus_limit to int

        logger.info(f"Minimum capacity: {min_capacity}, Truck limit: {min_truck_limit}, Bus limit: {min_bus_limit}")
        return min_capacity, min_truck_limit, min_bus_limit
    except Exception as e:
        logger.error(f"Error fetching parking capacity: {str(e)}")
        return f"Error fetching parking capacity: {str(e)}"


def get_parking_lots(material=None, service_level=None):
    try:
        logger.info(f"Fetching parking lots with material: {material} and service level: {service_level}")
        query = """
        SELECT id, name, service_toilets, surface_material, service_shelter, pricing, external, coordinates
        FROM public.parking_lot
        """
        conditions = []
        params = {}
        if material:
            conditions.append("surface_material = :material")
            params["material"] = material
        if service_level:
            conditions.append("pricing = :service_level")
            params["service_level"] = service_level

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        result = db.session.execute(text(query), params)
        parking_lots = result.fetchall()

        parking_lot_list = []
        for lot in parking_lots:
            parking_lot_list.append({
                "id": lot[0],  # Using index 0 for 'id'
                "name": lot[1],  # Using index 1 for 'name'
                "service_toilets": lot[2],  # Using index 2 for 'service_toilets'
                "surface_material": lot[3],  # Using index 3 for 'surface_material'
                "service_shelter": lot[4],  # Using index 4 for 'service_shelter'
                "pricing": lot[5],  # Using index 5 for 'pricing'
                "external": lot[6],  # Using index 6 for 'external'
                "coordinates": lot[7]  # Using index 7 for 'coordinates'
            })

        logger.info(f"Parking lots fetched: {parking_lot_list}")
        return parking_lot_list
    except Exception as e:
        logger.error(f"Error fetching parking lots: {str(e)}")
        return f"Error fetching parking lots: {str(e)}"



# Function to get the average distance between the halls and the parking lot
def get_average_distance(hall_ids, parking_lot_id):
    distances = []
    for hall_id in hall_ids:
        distance = distances_df[(distances_df['entrance_id'] == hall_id) & (distances_df['parking_lot_id'] == parking_lot_id)]
        if not distance.empty:
            distances.append(distance.iloc[0]['distance'])
    if distances:
        return sum(distances) / len(distances)
    else:
        return float('inf')

# Function to assign parking spaces based on demand and available lots
def assign_parking(lots, car_demand, bus_demand, truck_demand, phase, start_date, end_date, hall_ids):
    print(f"Assigning parking for {car_demand} cars, {bus_demand} busses, {truck_demand} trucks in {phase} phase")
    assigned_lots = {'cars': [], 'busses': [], 'trucks': []}
    remaining_demand = {'cars': car_demand, 'busses': bus_demand, 'trucks': truck_demand}
    
    # Determine if any halls in the event belong to west halls
    prioritize_20 = any(hall in west_halls for hall in hall_ids)
    
    # Calculate average distances for all lots
    lots_with_distances = [
        (lot, get_average_distance(hall_ids, lot['id'])) for lot in lots
    ]
    
    # Sort the lots by distance and by ID if prioritize_20 is True
    if prioritize_20:
        lots_sorted = sorted(lots_with_distances, key=lambda x: (x[0]['id'] != 20, x[1], x[0]['id']))
    else:
        lots_sorted = sorted(lots_with_distances, key=lambda x: (x[1], x[0]['id']))

    for lot, _ in lots_sorted:
        # Check min capacity for cars, busses, and trucks for the given parking lot
        min_free_capacity, truck_limit, bus_limit = check_min_parking_capacity(lot['id'], start_date, end_date)
        min_free_capacity = int(min_free_capacity) if isinstance(min_free_capacity, (int, float, str)) else 0
        truck_limit = int(truck_limit) if isinstance(truck_limit, (int, float, str)) else 0
        bus_limit = int(bus_limit) if isinstance(bus_limit, (int, float, str)) else 0

        while min_free_capacity > 0 and (remaining_demand['cars'] > 0 or remaining_demand['busses'] > 0 or remaining_demand['trucks'] > 0):
            # Check if the lot can store cars
            if remaining_demand['cars'] > 0 and min_free_capacity >= 1:
                allocated_capacity = min(min_free_capacity, remaining_demand['cars'])
                assigned_lots['cars'].append({'parking_lot_id': lot['id'], 'capacity': allocated_capacity})
                remaining_demand['cars'] -= allocated_capacity
                min_free_capacity -= allocated_capacity

            # Check if the lot can store busses and respect bus_limit
            elif remaining_demand['busses'] > 0 and min_free_capacity >= 3 and bus_limit > 0:
                allocated_capacity = min(min_free_capacity // 3, remaining_demand['busses'], bus_limit)
                assigned_lots['busses'].append({'parking_lot_id': lot['id'], 'capacity': allocated_capacity})
                remaining_demand['busses'] -= allocated_capacity
                min_free_capacity -= allocated_capacity * 3
                bus_limit -= allocated_capacity

            # Check if the lot can store trucks and respect truck_limit
            elif remaining_demand['trucks'] > 0 and min_free_capacity >= 4 and truck_limit > 0:
                allocated_capacity = min(min_free_capacity // 4, remaining_demand['trucks'], truck_limit)
                assigned_lots['trucks'].append({'parking_lot_id': lot['id'], 'capacity': allocated_capacity})
                remaining_demand['trucks'] -= allocated_capacity
                min_free_capacity -= allocated_capacity * 4
                truck_limit -= allocated_capacity

            else:
                break

        if all(demand == 0 for demand in remaining_demand.values()):
            break

    for lot in assigned_lots['busses']:
        lot['capacity'] *= 3
    for lot in assigned_lots['trucks']:
        lot['capacity'] *= 4

    print(f"Assigned lots: {assigned_lots}")
    return assigned_lots, remaining_demand


# Function to check minimum parking capacity for a specific lot and date range
def check_min_parking_capacity(parking_lot_id, start_date, end_date):
    try:
        logger.info(f"Checking minimum parking capacity for lot {parking_lot_id} from {start_date} to {end_date}")
        min_capacity, truck_limit, bus_limit = check_parking_capacity(parking_lot_id, start_date, end_date)

        if isinstance(min_capacity, str):
            logger.error(f"Error fetching parking capacity: {min_capacity}")
            return 0, 0, 0

        logger.info(f"Minimum capacity: {min_capacity}, Truck limit: {truck_limit}, Bus limit: {bus_limit}")
        return min_capacity, truck_limit, bus_limit
    except Exception as e:
        logger.error(f"Error in check_min_parking_capacity: {str(e)}")
        return 0, 0, 0



def recommendation_engine(event):
    recommendations = {}
    phases = ['assembly', 'runtime', 'disassembly']
    for phase in phases:
        print(f"Processing phase: {phase}")
        try:
            start_date = event[f'{phase}_start_date']
            end_date = event[f'{phase}_end_date']
            car_demand = int(event[f'{phase}_demand_cars'])
            bus_demand = int(event[f'{phase}_demand_busses'])
            truck_demand = int(event[f'{phase}_demand_trucks'])
            total_capacity = get_total_capacity(start_date, end_date)
            logger.info(f"Total capacity for {phase} phase: {total_capacity}")

            if isinstance(total_capacity, str):
                logger.error(f"Error: Total capacity returned as string: {total_capacity}")
                return f"Error: Total capacity returned as string: {total_capacity}"

            phase_recommendations = {'cars': [], 'busses': [], 'trucks': []}
            status_message = "ok"

            if car_demand > 0:
                hall_ids_set = set(event['hall_ids'])
                min_capacity, truck_limit, bus_limit = check_min_parking_capacity(20, start_date, end_date)
                if min_capacity >= car_demand:
                    assigned_cars, remaining_cars = assign_parking([{'id': 20}], car_demand, 0, 0, phase, start_date, end_date, event['hall_ids'])
                    phase_recommendations['cars'] = assigned_cars['cars']
                else:
                    suitable_lots = get_parking_lots(service_level='high')
                    if isinstance(suitable_lots, str):
                        logger.error(f"Error fetching parking lots: {suitable_lots}")
                        return f"Error fetching parking lots: {suitable_lots}"
                    assigned_cars, remaining_cars = assign_parking(suitable_lots, car_demand, 0, 0, phase, start_date, end_date, event['hall_ids'])
                    phase_recommendations['cars'] = assigned_cars['cars']

                if remaining_cars['cars'] > 0:
                    status_message = f"Allocated within capacities, but missing capacities for {remaining_cars['cars']} car units"

            if truck_demand > 0:
                min_capacity, truck_limit, bus_limit = check_min_parking_capacity(5, start_date, end_date)
                if min_capacity >= truck_demand:
                    assigned_trucks, remaining_trucks = assign_parking([{'id': 5}], 0, 0, truck_demand, phase, start_date, end_date, event['hall_ids'])
                    phase_recommendations['trucks'] = assigned_trucks['trucks']
                else:
                    remaining_truck_demand = truck_demand - min_capacity
                    assigned_trucks, remaining_trucks = assign_parking([{'id': 5}], 0, 0, truck_demand - remaining_truck_demand, phase, start_date, end_date, event['hall_ids'])
                    phase_recommendations['trucks'] = assigned_trucks['trucks']
                    if remaining_truck_demand > 0:
                        suitable_lots = get_parking_lots()
                        if isinstance(suitable_lots, str):
                            logger.error(f"Error fetching parking lots: {suitable_lots}")
                            return f"Error fetching parking lots: {suitable_lots}"
                        additional_trucks, remaining_trucks = assign_parking(suitable_lots, 0, 0, remaining_truck_demand, phase, start_date, end_date, event['hall_ids'])
                        phase_recommendations['trucks'].extend(additional_trucks['trucks'])

                if remaining_trucks['trucks'] > 0:
                    status_message = f"Allocated within capacities, but missing capacities for {remaining_trucks['trucks']} truck units"

            suitable_lots = get_parking_lots()
            if isinstance(suitable_lots, str):
                logger.error(f"Error fetching parking lots: {suitable_lots}")
                return f"Error fetching parking lots: {suitable_lots}"
            assigned_all, remaining_all = assign_parking(suitable_lots, car_demand, bus_demand, truck_demand, phase, start_date, end_date, event['hall_ids'])
            phase_recommendations.update(assigned_all)

            if isinstance(phase_recommendations, str):
                return phase_recommendations

            recommendations[phase] = phase_recommendations
            recommendations[phase]['status'] = status_message
        except Exception as e:
            logger.error(f"Error generating recommendations for phase {phase}: {str(e)}")
            recommendations[phase] = {"status": "Error generating recommendations, please try again later"}

    logger.info(f"Recommendations: {recommendations}")
    return recommendations

# Function to adjust recommendations for bus and truck capacities
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

# Flask route to get recommendations
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
