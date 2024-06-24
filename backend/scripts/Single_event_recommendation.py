import pandas as pd
from datetime import datetime
import requests

#Section to intialize data

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

# Split the data into lines and then into values
lines = data.strip().split("\n")
values = [line.split(",") for line in lines]

# Create the dataframe
distances_df = pd.DataFrame(values, columns=["entrance_id", "parking_lot_id", "distance"])

# Convert the columns to the appropriate data types
distances_df["entrance_id"] = distances_df["entrance_id"].astype(int)
distances_df["parking_lot_id"] = distances_df["parking_lot_id"].astype(int)
distances_df["distance"] = distances_df["distance"].astype(int)


#
#def recommendation_engine():
    #iterate over phases with a counting loop
    # select car demands, truck demands and bus demands for first phase
    # identify startdate and enddate of the phase
    # select first demand to assign
    #API call to /api/dashboard/total_capacity?start_date=startdate&end_date=endate
    # choose minimum capacity returned as treshold for time frame
    # if demand > treshhold -> return error message
    # if runtime
        # if car demand
            #if assigned halls are in / equal to ids 1,2,3,7,8,9,13,14,15
            # check if parking lot id = 20 has free capacity for this time frame; done by using the /api/parking/capacities/<int:parking_lot_id> endpoint
            # if  20 has enough free spaces assigne it
            # if not check for a parking lot with a higher service level that has enough free space to fulfill demand; done by using /api/paskring/spaces;
                # singular lot can fullfill demand? -> choose the one with highest service level
                    # none free; recommend shortest distance to the entrace
                # else assign multiple lots with most free capacity
        # if truck demand
            # if truck demand > 500 check if parking lot id 5 is free in the time frame
                # if yes and the demand is <= the capacity assign 5
                # if capacity from 5 insufficient, check for lots with material asphalt that have free capacity, order by highest free capacity and shortest distance
        # else case bus demand
            #if singular lot with enough capacity free recommend
            #else recommend multiple lots ranked by most free capacity
    #else
        #if truck demand
            # if truck demand > 500 check if parking lot id 5 is free in the time frame
            # if yes and the demand is <= the capacity assign 5
            # if capacity from 5 insufficient, check for lots with material asphalt that have free capacity, order by highest free capacity and shortest distance
        # if car demand
            # if assigned halls are in / equal to ids 1,2,3,7,8,9,13,14,15
                # check if parking lot id = 20 has free capacity for this time frame; done by using the /api/parking/capacities/<int:parking_lot_id> endpoint
                # if  20 has enough free spaces assigne it
                # if not check for a parking lot with a higher service level that has enough free space to fulfill demand; done by using /api/paskring/spaces;
                # singular lot can fullfill demand? -> choose the one with highest service level
                    # none free; recommend shortest distance to the entrace
                # else assign multiple lots with most free capacity
        # else case bus demand
            # if singular lot with enough capacity free recommend
            # else recommend multiple lots ranked by most free capacity
    #mark that demand as checked
    #output recommendation
    # proceed with next

 # Define the event data (this would normally be loaded from a database or API)
event_data = {
    'id': 90,
    'name': 'OPTI München',
    'assembly_start_date': '2024-01-07',
    'assembly_end_date': '2024-01-11',
    'runtime_start_date': '2024-01-12',
    'runtime_end_date': '2024-01-15',
    'disassembly_start_date': '2024-01-16',
    'disassembly_end_date': '2024-01-18',
    'entrance': 'north_east',
    'hall_ids': [13, 14, 15, 16],
    'assembly_demand_cars': 600,
    'assembly_demand_busses': 30,
    'assembly_demand_trucks': 110,
    'runtime_demand_cars': 3120,
    'runtime_demand_busses': 60,
    'runtime_demand_trucks': 60,
    'disassembly_demand_cars': 580,
    'disassembly_demand_busses': 30,
    'disassembly_demand_trucks': 110
}

# API URLs
TOTAL_CAPACITY_URL = "http://localhost:5000/dashboard/total_capacity"
PARKING_CAPACITIES_URL = "http://localhost:5000/parking/capacities/{}"  # Expects parking_lot_id to be formatted in
PARKING_SPACES_URL = "http://localhost:5000/parking/spaces"


# Helper function to fetch total capacity for a given date range
def get_total_capacity(start_date, end_date):
    try:
        response = requests.get(TOTAL_CAPACITY_URL, params={'start_date': start_date, 'end_date': end_date})
        response.raise_for_status()

        capacities = response.json()
        if isinstance(capacities, list):
            # Extract minimum total_capacity for the date range
            min_capacity = min(capacity.get("total_capacity", 0) for capacity in capacities)
            return int(min_capacity)  # Convert to integer

        return 0  # Handle case where capacities is not a list or is empty

    except requests.exceptions.RequestException as e:
        return f"Error fetching total capacity: {str(e)}"
    except (KeyError, ValueError) as e:
        return f"Error parsing total capacity response: {str(e)}"


# Helper function to fetch parking capacities for a specific parking lot ID and time frame
def check_parking_capacity(parking_lot_id, start_date, end_date):
    try:
        response = requests.get(PARKING_CAPACITIES_URL.format(parking_lot_id),
                                params={'start_date': start_date, 'end_date': end_date})
        response.raise_for_status()

        capacities = response.json()
        if isinstance(capacities, list) and capacities:
            # Assuming the API response contains capacity information for the given parking_lot_id
            first_item = capacities[0]
            free_capacity = first_item.get('capacity', 0)  # Extracting 'capacity' as free_capacity

            # Convert free_capacity to integer
            free_capacity = int(free_capacity) if isinstance(free_capacity, (int, float, str)) else 0
            print(free_capacity)
            return free_capacity

        return 0  # Return 0 if capacities not available or handle error as appropriate

    except requests.exceptions.RequestException as e:
        return f"Error fetching parking capacity: {str(e)}"
    except (KeyError, ValueError) as e:
        return f"Error parsing parking capacity response: {str(e)}"


# Function to recommend parking assignments based on event phases
def recommendation_engine(event):
    recommendations = {}
    phases = ['assembly', 'runtime', 'disassembly']

    for phase in phases:
        start_date = event[f'{phase}_start_date']
        end_date = event[f'{phase}_end_date']
        car_demand = int(event[f'{phase}_demand_cars'])
        bus_demand = int(event[f'{phase}_demand_busses'])
        truck_demand = int(event[f'{phase}_demand_trucks'])

        total_capacity = get_total_capacity(start_date, end_date)
        if isinstance(total_capacity, str):
            return f"Error: Total capacity returned as string: {total_capacity}"

        if car_demand > total_capacity or bus_demand > total_capacity or truck_demand > total_capacity:
            return f"Error: Demand for {phase} phase exceeds total capacity"

        phase_recommendations = {}

        if car_demand > 0:
            hall_ids_set = set(event['hall_ids'])
            if any(id in hall_ids_set for id in [1, 2, 3, 7, 8, 9, 13, 14, 15]):
                if check_parking_capacity(20, start_date, end_date) >= car_demand:
                    phase_recommendations['cars'] = assign_parking([{'id': 20}], car_demand, phase, start_date,
                                                                   end_date)
                else:
                    suitable_lots = get_parking_lots(service_level='high')
                    phase_recommendations['cars'] = assign_parking(suitable_lots, car_demand, phase, start_date,
                                                                   end_date)
            else:
                suitable_lots = get_parking_lots()
                phase_recommendations['cars'] = assign_parking(suitable_lots, car_demand, phase, start_date, end_date)

        if truck_demand > 0:
            if truck_demand > 500 and check_parking_capacity(5, start_date, end_date) >= truck_demand:
                phase_recommendations['trucks'] = assign_parking([{'id': 5}], truck_demand, phase, start_date, end_date)
            else:
                suitable_lots = get_parking_lots(material='asphalt')
                phase_recommendations['trucks'] = assign_parking(suitable_lots, truck_demand, phase, start_date,
                                                                 end_date)

        if bus_demand > 0:
            suitable_lots = get_parking_lots()
            phase_recommendations['busses'] = assign_parking(suitable_lots, bus_demand, phase, start_date, end_date)

        recommendations[phase] = phase_recommendations

    return recommendations


# Function to fetch parking lots based on optional criteria
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


# Function to assign parking based on demand and available capacity
def assign_parking(lots, demand, phase, start_date, end_date):
    assigned_lots = []
    remaining_demand = demand

    for lot in lots:
        free_capacity = check_parking_capacity(lot['id'], start_date, end_date)

        # Ensure free_capacity is converted to integer
        free_capacity = int(free_capacity) if isinstance(free_capacity, (int, float, str)) else 0

        if free_capacity >= remaining_demand:
            assigned_lots.append({'parking_lot_id': lot['id'], 'capacity': remaining_demand})
            remaining_demand = 0
            break
        else:
            assigned_lots.append({'parking_lot_id': lot['id'], 'capacity': free_capacity})
            remaining_demand -= free_capacity

    if remaining_demand > 0:
        return f"Error: Not enough capacity to fulfill {phase} demand"

    return assigned_lots


# Run Recommendation Engine and handle errors
recommendations = recommendation_engine(event_data)
print(recommendations)
