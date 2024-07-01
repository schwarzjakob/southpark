"""
Messe München Parking Lot Recommendation Engine


Introduction:
This script is designed to recommend optimal parking lot assignments for events based on the demand for car, bus, and truck parking spaces. The recommendation system takes into account various factors such as the proximity of parking lots to event halls, the capacity of each parking lot, and specific requirements like prioritizing certain parking lots for events involving specific halls.

Key Features:
1. Data Initialization: Load and process data regarding distances between entrances and parking lots.
2. Parking Lot Information: Fetch detailed information about available parking lots from the database.
3. Distance Calculation: Compute average distances from parking lots to event halls.
4. Capacity Calculation: Fetch and compute the free capacities and limits for cars, buses, and trucks in each parking lot.
5. Parking Assignment: Assign parking lots to meet the demand for cars, buses, and trucks based on their capacities and distances.
6. Prioritization: Prioritize certain parking lots if specific halls are involved in the event.

This script is organized into several sections, each handling a specific aspect of the recommendation process. Logging is used throughout the script to facilitate debugging and to provide insights into the recommendation process.

Credits: Timon Tirtey (LMU), Sven Tiefenthaler (LMU)

# Steps:

1. Import necessary libraries and modules
   - Import pandas as pd
   - Import requests
   - Import datetime and timedelta from datetime
   - Import Blueprint, request, jsonify from flask
   - Import db from extensions
   - Import text from sqlalchemy
   - Import logging

2. Setup logging configuration
   - Set logging level to INFO
   - Create a logger object

3. Create a Flask Blueprint for the recommendation route
   - recommendation_bp = Blueprint("recommendation", __name__)

4. Define distances data and create a DataFrame from the values
   - Split the raw data string into lines and then into individual values
   - Create a DataFrame from the values
   - Convert the columns to the appropriate data types

2. Fetch parking lots based on material and service level
    a) Define the get_parking_lots function
    b) Construct the SQL query with optional conditions for material and service level
        - if material:
            - conditions.append("surface_material = :material")
            - params["material"] = material
        - if service_level:
            - conditions.append("pricing = :service_level")
            - params["service_level"] = service_level
    c) Execute the query and fetch results
    d) Return the list of parking lots
        - return parking_lot_list

3. Calculate average distance for a parking lot from given hall IDs
    a) Define the get_average_distance function
    b) Fetch distances from the distances DataFrame
        - distances = distances_df[(distances_df['entrance_id'].isin(hall_ids)) & (distances_df['parking_lot_id'] == parking_lot_id)]
    c) Calculate and return the average distance
        - if not distances.empty:
            - average_distance = distances['distance'].mean()
        - else:
            - average_distance = float('inf')
        - return average_distance

4. Fetch parking capacities for given parking lot IDs, start and end dates, excluding allocations for a specific event
    a) Define the fetch_parking_capacities function
    b) Construct and execute the SQL query to fetch capacities
    c) Fetch results and convert to a dictionary
        - capacities = {row[0]: row[1:] for row in result}
    d) Return the capacities
        - return capacities

5. Prepare capacity data for the given lots, start and end dates, and event ID
    a) Define the prepare_capacity_data function
    b) Fetch parking lot IDs from the lots
        - parking_lot_ids = [lot['id'] for lot in lots]
    c) Fetch capacities for the given parking lot IDs, start and end dates, and event ID
    d) Create a DataFrame from the capacity data
        - capacity_data = []
        - for lot in lots:
            - if lot['id'] in capacities:
                - min_free_capacity, min_truck_units, min_bus_units = capacities[lot['id']]
                - capacity_data.append({
                    "parking_lot_id": lot['id'],
                    "remaining_free_capacity": min_free_capacity,
                    "bus_limit": min_bus_units,
                    "truck_limit": min_truck_units,
                    "prio_weighting": 0  # Placeholder for priority weighting
                })
        - capacity_df = pd.DataFrame(capacity_data)
    e) Return the capacity DataFrame
        - return capacity_df

6. Calculate priority based on distances and remaining capacity
    a) Define the calculate_priority function
    b) Calculate the average distance for each parking lot
        - df['average_distance'] = df['parking_lot_id'].apply(lambda lot_id: get_average_distance(hall_ids, lot_id))
    c) Calculate the priority weighting as a combination of average distance and inverse of remaining capacity
        - df['prio_weighting'] = df.apply(lambda row: row['average_distance'] + (1000 / (row['remaining_free_capacity'] + 1)), axis=1)
    d) Return the updated DataFrame
        - return df

7. Assign parking based on demand, phase, dates, hall IDs, and event ID
    a) Define the assign_parking function
    b) Initialize assigned lots and remaining demand dictionaries
        - assigned_lots = {'cars': [], 'buses': [], 'trucks': []}
        - remaining_demand = {'cars': car_demand, 'buses': bus_demand, 'trucks': truck_demand}
    c) Determine if any halls belong to west halls
        - prioritize_20 = any(hall in west_halls for hall in hall_ids)
    d) Calculate average distances and sort lots based on distance and priority
        - lots_with_distances = [(lot, get_average_distance(hall_ids, lot['id'])) for lot in lots]
        - if prioritize_20:
            - lots_sorted = sorted(lots_with_distances, key=lambda x: (x[0]['id'] != 20, x[1], x[0]['id']))
        - else:
            - lots_sorted = sorted(lots_with_distances, key=lambda x: (x[1], x[0]['id']))
    e) Prepare capacity data and calculate priority
        - capacity_df = prepare_capacity_data([lot[0] for lot in lots_sorted], start_date, end_date, event_id)
        - capacity_df = calculate_priority(capacity_df, hall_ids)
    f) Iterate over sorted lots and allocate parking based on remaining capacity and demand
        - for lot, _ in lots_sorted:
            - lot_capacity = capacity_df[capacity_df['parking_lot_id'] == lot['id']]
            - if lot_capacity.empty:
                - continue
            - remaining_free_capacity = lot_capacity.iloc[0]['remaining_free_capacity']
            - bus_limit = lot_capacity.iloc[0]['bus_limit']
            - truck_limit = lot_capacity.iloc[0]['truck_limit']
            - while remaining_free_capacity > 0 and (remaining_demand['cars'] > 0 or remaining_demand['buses'] > 0 or remaining_demand['trucks'] > 0):
                - if remaining_demand['cars'] > 0 and remaining_free_capacity > 0:
                    - allocated_capacity = min(remaining_free_capacity, remaining_demand['cars'])
                    - assigned_lots['cars'].append({'parking_lot_id': lot['id'], 'capacity': allocated_capacity})
                    - remaining_demand['cars'] -= allocated_capacity
                    - remaining_free_capacity -= allocated_capacity
                - elif remaining_demand['buses'] > 0 and remaining_free_capacity >= 3 and bus_limit > 0:
                    - allocated_capacity = min(remaining_free_capacity // 3, remaining_demand['buses'], bus_limit)
                    - assigned_lots['buses'].append({'parking_lot_id': lot['id'], 'capacity': allocated_capacity})
                    - remaining_demand['buses'] -= allocated_capacity
                    - remaining_free_capacity -= allocated_capacity * 3
                    - bus_limit -= allocated_capacity
                - elif remaining_demand['trucks'] > 0 and remaining_free_capacity >= 4 and truck_limit > 0:
                    - allocated_capacity = min(remaining_free_capacity // 4, remaining_demand['trucks'], truck_limit)
                    - assigned_lots['trucks'].append({'parking_lot_id': lot['id'], 'capacity': allocated_capacity})
                    - remaining_demand['trucks'] -= allocated_capacity
                    - remaining_free_capacity -= allocated_capacity * 4
                    - truck_limit -= allocated_capacity
                - else:
                    - break
            - if all(demand == 0 for demand in remaining_demand.values()):
                - break
        - for lot in assigned_lots['buses']:
            - lot['capacity'] *= 3
        - for lot in assigned_lots['trucks']:
            - lot['capacity'] *= 4
    g) Return assigned lots and remaining demand
        - return assigned_lots, remaining_demand

8. Generate recommendations for each phase of the event
    a) Define the recommendation_engine function
    b) Iterate over each phase and extract phase data
        - for phase in phases:
            - start_date = event[f'{phase}_start_date']
            - end_date = event[f'{phase}_end_date']
            - car_demand = int(event[f'{phase}_demand_cars'])
            - bus_demand = int(event[f'{phase}_demand_buses'])
            - truck_demand = int(event[f'{phase}_demand_trucks'])
    c) Fetch suitable parking lots and assign parking
        - if car_demand > 0:
            - suitable_lots = get_parking_lots(service_level='high')
            - assigned_cars, remaining_cars = assign_parking(suitable_lots, car_demand, 0, 0, phase, start_date, end_date, event['hall_ids'], event['id'])
            - phase_recommendations['cars'] = assigned_cars['cars']
            - if remaining_cars['cars'] > 0:
                - status_message = f"Allocated within capacities, but missing capacities for {remaining_cars['cars']} car units"
        - if truck_demand > 0:
            - suitable_lots = get_parking_lots()
            - assigned_trucks, remaining_trucks = assign_parking(suitable_lots, 0, 0, truck_demand, phase, start_date, end_date, event['hall_ids'], event['id'])
            - phase_recommendations['trucks'] = assigned_trucks['trucks']
            - if remaining_trucks['trucks'] > 0:
                - status_message = f"Allocated within capacities, but missing capacities for {remaining_trucks['trucks']} truck units"
    d) Update recommendations with assigned lots and status messages
        - recommendations[phase] = phase_recommendations
        - recommendations[phase]['status'] = status_message
    e) Return recommendations
        - return recommendations

9. Adjust capacities in recommendations for buses and trucks
    a) Define the adjust_recommendations function
    b) Adjust capacities by dividing by 3 for buses and 4 for trucks
        - def adjust_capacity(vehicles, divisor):
            - for vehicle in vehicles:
                - vehicle['capacity'] = round(vehicle['capacity'] / divisor)
        - for phase in ['assembly', 'disassembly', 'runtime']:
            - if 'buses' in recommendations[phase]:
                - adjust_capacity(recommendations[phase]['buses'], 3)
            - if 'trucks' in recommendations[phase]:
                - adjust_capacity(recommendations[phase]['trucks'], 4)
    c) Return adjusted recommendations
        - return recommendations

10. Create a Flask route to get recommendations
    a) Define the get_recommendations route
    b) Extract event ID from the request
        - event_id = request.json.get("id")
    c) Fetch event and entrance data from the database
        - event = db.session.execute(text(event_query), {"event_id": event_id}).fetchone()
        - entrance = db.session.execute(text(entrance_query), {"event_id": event_id}).fetchone()
    d) Generate and adjust recommendations
        - recommendations = recommendation_engine(event_data)
        - recommendations_adjusted = adjust_recommendations(recommendations)
    e) Return recommendations as a JSON response
        - return jsonify(recommendations_adjusted), 200
"""

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
distances_df = pd.DataFrame(
    values, columns=["entrance_id", "parking_lot_id", "distance"]
)
# Convert the columns to the appropriate data types
distances_df["entrance_id"] = distances_df["entrance_id"].astype(int)
distances_df["parking_lot_id"] = distances_df["parking_lot_id"].astype(int)
distances_df["distance"] = distances_df["distance"].astype(int)



def get_parking_lots(material=None, service_level=None):
    try:
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
            parking_lot_list.append(
                {
                    "id": lot[0], 
                    "name": lot[1],  
                    "service_toilets": lot[2], 
                    "surface_material": lot[3],  
                    "service_shelter": lot[4], 
                    "pricing": lot[5], 
                    "external": lot[6],  
                    "coordinates": lot[7],  
                }
            )

        return parking_lot_list
    except Exception as e:
        logger.error(f"Error fetching parking lots: {str(e)}")
        return f"Error fetching parking lots: {str(e)}"


def get_average_distance(hall_ids, parking_lot_id):
    distances = distances_df[
        (distances_df["entrance_id"].isin(hall_ids))
        & (distances_df["parking_lot_id"] == parking_lot_id)
    ]
    if not distances.empty:
        average_distance = distances["distance"].mean()
    else:
        average_distance = float("inf")
    return average_distance


def fetch_parking_capacities(parking_lot_ids, start_date, end_date, event_id):

    query = f"""
    WITH date_series AS (
        SELECT generate_series('{start_date}'::date, '{end_date}'::date, '1 day'::interval) AS date
    ),
    capacity_data AS (
        SELECT
            ds.date,
            pc.parking_lot_id,
            pc.capacity - COALESCE(SUM(pa.allocated_capacity) FILTER (WHERE pa.event_id != {event_id}), 0) AS free_capacity,
            LEAST(
                (pc.capacity - COALESCE(SUM(pa.allocated_capacity) FILTER (WHERE pa.event_id != {event_id}), 0)) / 4,
                pc.truck_limit - COALESCE(SUM(pa.allocated_trucks) FILTER (WHERE pa.event_id != {event_id}), 0)
            ) AS available_truck_units,
            LEAST(
                (pc.capacity - COALESCE(SUM(pa.allocated_capacity) FILTER (WHERE pa.event_id != {event_id}), 0)) / 3,
                pc.bus_limit - COALESCE(SUM(pa.allocated_buses) FILTER (WHERE pa.event_id != {event_id}), 0)
            ) AS available_bus_units
        FROM
            date_series ds
        LEFT JOIN
            public.parking_lot_capacity pc
            ON ds.date BETWEEN pc.valid_from AND pc.valid_to
        LEFT JOIN
            public.parking_lot_allocation pa
            ON pc.parking_lot_id = pa.parking_lot_id
            AND ds.date = pa.date
        WHERE
            pc.parking_lot_id IN ({','.join(map(str, parking_lot_ids))})
        GROUP BY
            ds.date, pc.parking_lot_id, pc.capacity, pc.truck_limit, pc.bus_limit
    ),
    min_values AS (
        SELECT
            parking_lot_id,
            MIN(free_capacity) AS min_free_capacity,
            MIN(available_truck_units) AS min_truck_units,
            MIN(available_bus_units) AS min_bus_units
        FROM
            capacity_data
        GROUP BY
            parking_lot_id
    )
    SELECT
        parking_lot_id,
        min_free_capacity,
        min_truck_units,
        min_bus_units
    FROM
        min_values;
    """
    result = db.session.execute(text(query)).fetchall()
    capacities = {row[0]: row[1:] for row in result}
    return capacities


def prepare_capacity_data(lots, start_date, end_date, event_id):

    parking_lot_ids = [lot["id"] for lot in lots]
    capacities = fetch_parking_capacities(
        parking_lot_ids, start_date, end_date, event_id
    )
    capacity_data = []
    for lot in lots:
        if lot["id"] in capacities:
            min_free_capacity, min_truck_units, min_bus_units = capacities[lot["id"]]
            capacity_data.append(
                {
                    "parking_lot_id": lot["id"],
                    "remaining_free_capacity": min_free_capacity,
                    "bus_limit": min_bus_units,
                    "truck_limit": min_truck_units,
                    "prio_weighting": 0,  
                }
            )
    capacity_df = pd.DataFrame(capacity_data)
    return capacity_df


def calculate_priority(df, hall_ids):
    df["average_distance"] = df["parking_lot_id"].apply(
        lambda lot_id: get_average_distance(hall_ids, lot_id)
    )

    # Berechnung der Prioritätsgewichtung als Kombination aus durchschnittlicher Entfernung und umgekehrter Kapazität
    df["prio_weighting"] = df.apply(
        lambda row: row["average_distance"]
        + (1000 / (row["remaining_free_capacity"] + 1)),
        axis=1,
    )

    return df


def assign_parking(
    lots,
    car_demand,
    bus_demand,
    truck_demand,
    phase,
    start_date,
    end_date,
    hall_ids,
    event_id,
):
    assigned_lots = {"cars": [], "buses": [], "trucks": []}
    remaining_demand = {"cars": car_demand, "buses": bus_demand, "trucks": truck_demand}

    # Determine if any halls in the event belong to west halls
    prioritize_20 = any(hall in west_halls for hall in hall_ids)

    # Calculate average distances for all lots
    lots_with_distances = [
        (lot, get_average_distance(hall_ids, lot["id"])) for lot in lots
    ]

    # Sort the lots by distance and by ID if prioritize_20 is True
    if prioritize_20:
        lots_sorted = sorted(
            lots_with_distances, key=lambda x: (x[0]["id"] != 20, x[1], x[0]["id"])
        )
    else:
        lots_sorted = sorted(lots_with_distances, key=lambda x: (x[1], x[0]["id"]))

    # Prepare capacity data
    capacity_df = prepare_capacity_data(
        [lot[0] for lot in lots_sorted], start_date, end_date, event_id
    )

    # Calculate priority based on distances and remaining capacity
    capacity_df = calculate_priority(capacity_df, hall_ids)

    for lot, _ in lots_sorted:
        lot_capacity = capacity_df[capacity_df["parking_lot_id"] == lot["id"]]
        if lot_capacity.empty:
            continue
        remaining_free_capacity = lot_capacity.iloc[0]["remaining_free_capacity"]
        bus_limit = lot_capacity.iloc[0]["bus_limit"]
        truck_limit = lot_capacity.iloc[0]["truck_limit"]

        while remaining_free_capacity > 0 and (
            remaining_demand["cars"] > 0
            or remaining_demand["buses"] > 0
            or remaining_demand["trucks"] > 0
        ):
            if remaining_demand["cars"] > 0 and remaining_free_capacity > 0:
                allocated_capacity = min(
                    remaining_free_capacity, remaining_demand["cars"]
                )
                assigned_lots["cars"].append(
                    {"parking_lot_id": lot["id"], "capacity": allocated_capacity}
                )
                remaining_demand["cars"] -= allocated_capacity
                remaining_free_capacity -= allocated_capacity
            elif (
                remaining_demand["buses"] > 0
                and remaining_free_capacity >= 3
                and bus_limit > 0
            ):
                allocated_capacity = min(
                    remaining_free_capacity // 3, remaining_demand["buses"], bus_limit
                )
                assigned_lots["buses"].append(
                    {"parking_lot_id": lot["id"], "capacity": allocated_capacity}
                )
                remaining_demand["buses"] -= allocated_capacity
                remaining_free_capacity -= allocated_capacity * 3
                bus_limit -= allocated_capacity
            elif (
                remaining_demand["trucks"] > 0
                and remaining_free_capacity >= 4
                and truck_limit > 0
            ):
                allocated_capacity = min(
                    remaining_free_capacity // 4,
                    remaining_demand["trucks"],
                    truck_limit,
                )
                assigned_lots["trucks"].append(
                    {"parking_lot_id": lot["id"], "capacity": allocated_capacity}
                )
                remaining_demand["trucks"] -= allocated_capacity
                remaining_free_capacity -= allocated_capacity * 4
                truck_limit -= allocated_capacity
            else:
                break

        if all(demand == 0 for demand in remaining_demand.values()):
            break

    for lot in assigned_lots["buses"]:
        lot["capacity"] *= 3
    for lot in assigned_lots["trucks"]:
        lot["capacity"] *= 4

    return assigned_lots, remaining_demand


def recommendation_engine(event):
    recommendations = {}
    phases = ["assembly", "runtime", "disassembly"]
    for phase in phases:
        try:
            start_date = event[f"{phase}_start_date"]
            end_date = event[f"{phase}_end_date"]
            car_demand = int(event[f"{phase}_demand_cars"])
            bus_demand = int(event[f"{phase}_demand_buses"])
            truck_demand = int(event[f"{phase}_demand_trucks"])

            phase_recommendations = {"cars": [], "buses": [], "trucks": []}
            status_message = "ok"

            if car_demand > 0:
                hall_ids_set = set(event["hall_ids"])
                suitable_lots = get_parking_lots(service_level="high")
                if isinstance(suitable_lots, str):
                    logger.error(f"Error fetching parking lots: {suitable_lots}")
                    return f"Error fetching parking lots: {suitable_lots}"
                assigned_cars, remaining_cars = assign_parking(
                    suitable_lots,
                    car_demand,
                    0,
                    0,
                    phase,
                    start_date,
                    end_date,
                    event["hall_ids"],
                    event["id"],
                )
                phase_recommendations["cars"] = assigned_cars["cars"]

                if remaining_cars["cars"] > 0:
                    status_message = f"Allocated within capacities, but missing capacities for {remaining_cars['cars']} car units"

            if truck_demand > 0:
                remaining_truck_demand = truck_demand
                assigned_trucks, remaining_trucks = assign_parking(
                    [{"id": 5}],
                    0,
                    0,
                    truck_demand,
                    phase,
                    start_date,
                    end_date,
                    event["hall_ids"],
                    event["id"],
                )
                phase_recommendations["trucks"] = assigned_trucks["trucks"]
                if remaining_truck_demand > 0:
                    suitable_lots = get_parking_lots()
                    if isinstance(suitable_lots, str):
                        logger.error(f"Error fetching parking lots: {suitable_lots}")
                        return f"Error fetching parking lots: {suitable_lots}"
                    additional_trucks, remaining_trucks = assign_parking(
                        suitable_lots,
                        0,
                        0,
                        remaining_truck_demand,
                        phase,
                        start_date,
                        end_date,
                        event["hall_ids"],
                        event["id"],
                    )
                    phase_recommendations["trucks"].extend(additional_trucks["trucks"])

                if remaining_trucks["trucks"] > 0:
                    status_message = f"Allocated within capacities, but missing capacities for {remaining_trucks['trucks']} truck units"

            suitable_lots = get_parking_lots()
            if isinstance(suitable_lots, str):
                logger.error(f"Error fetching parking lots: {suitable_lots}")
                return f"Error fetching parking lots: {suitable_lots}"
            assigned_all, remaining_all = assign_parking(
                suitable_lots,
                car_demand,
                bus_demand,
                truck_demand,
                phase,
                start_date,
                end_date,
                event["hall_ids"],
                event["id"],
            )
            phase_recommendations.update(assigned_all)

            if isinstance(phase_recommendations, str):
                return phase_recommendations

            recommendations[phase] = phase_recommendations
            recommendations[phase]["status"] = status_message
        except Exception as e:
            logger.error(
                f"Error generating recommendations for phase {phase}: {str(e)}"
            )
            recommendations[phase] = {
                "status": "Error generating recommendations, please try again later"
            }

    return recommendations


def adjust_recommendations(recommendations):
    def adjust_capacity(vehicles, divisor):
        for vehicle in vehicles:
            vehicle["capacity"] = round(vehicle["capacity"] / divisor)

    for phase in ["assembly", "disassembly", "runtime"]:
        if "buses" in recommendations[phase]:
            adjust_capacity(recommendations[phase]["buses"], 3)
        if "trucks" in recommendations[phase]:
            adjust_capacity(recommendations[phase]["trucks"], 4)
    return recommendations


@recommendation_bp.route("/engine", methods=["POST"])
def get_recommendations():
    try:
        event_id = request.json.get("id")
        if not event_id:
            return jsonify({"error": "Event ID is required"}), 400

        event_query = """
            SELECT 
                e.id, e.name, e.assembly_start_date, e.assembly_end_date, 
                e.runtime_start_date, e.runtime_end_date, e.disassembly_start_date, 
                e.disassembly_end_date,
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
            WHERE e.id = :event_id
        """

        entrance_query = """
            SELECT 
                ARRAY(SELECT entrance_id FROM entrance_occupation WHERE event_id = :event_id) AS entrance_ids
        """

        event = db.session.execute(text(event_query), {"event_id": event_id}).fetchone()
        entrance = db.session.execute(
            text(entrance_query), {"event_id": event_id}
        ).fetchone()

        if not event:
            return jsonify({"error": "Event not found"}), 404

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
            "assembly_demand_buses": event.assembly_demand_buses,
            "assembly_demand_trucks": event.assembly_demand_trucks,
            "runtime_demand_cars": event.runtime_demand_cars,
            "runtime_demand_buses": event.runtime_demand_buses,
            "runtime_demand_trucks": event.runtime_demand_trucks,
            "disassembly_demand_cars": event.disassembly_demand_cars,
            "disassembly_demand_buses": event.disassembly_demand_buses,
            "disassembly_demand_trucks": event.disassembly_demand_trucks,
        }

        recommendations = recommendation_engine(event_data)
        recommendations_adjusted = adjust_recommendations(recommendations)

        return jsonify(recommendations_adjusted), 200
    except Exception as e:
        logger.error("Error in get_recommendations: %s", str(e))
        print(f"Error in get_recommendations: {str(e)}")
        return jsonify({"error": str(e)}), 500
