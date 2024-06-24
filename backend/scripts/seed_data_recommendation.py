import csv
import psycopg2
from datetime import datetime

# Database connection parameters
conn_params = "postgresql://neondb_owner:EYShfa1td0IW@ep-shy-frost-a2a25knj.eu-central-1.aws.neon.tech/recommendation_testing?sslmode=require"

# Establishing connection to PostgreSQL
conn = psycopg2.connect(conn_params)
cursor = conn.cursor()

distances_str = """
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


# Function to parse distances into a dictionary for easy lookup
def parse_distances(distances_str):
    distances = {}
    for line in distances_str.strip().split('\n'):
        entrance, lot, distance = map(int, line.split(','))
        if entrance not in distances:
            distances[entrance] = {}
        distances[entrance][lot] = distance
    return distances


# Parse distances
distances = parse_distances(distances_str)

# Mapping from CSV entrance names to DB entrance names
entrance_name_mapping = {
    'west': 'West',
    'north_west': 'North West',  # Corrected key
    'nort': 'North',
    'north_east': 'North East',  # Corrected key
    'east': 'East'
}


# Function to fetch entrance ID based on name
def get_entrance_id(entrance_name):
    db_entrance_name = entrance_name_mapping.get(entrance_name.lower())
    if db_entrance_name is None:
        raise ValueError(f"Entrance name '{entrance_name}' is not recognized.")

    try:
        cursor.execute("""
                       SELECT id
                       FROM entrance
                       WHERE name = %s
                       """, (db_entrance_name,))
        result = cursor.fetchone()
        if result is None:
            raise ValueError(f"Entrance '{db_entrance_name}' not found in the database.")
        entrance_id = result[0]
        return entrance_id
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error in get_entrance_id: {e}")
        raise e


# Function to fetch total capacity for a given date range
def get_total_capacity(start_date, end_date):
    try:
        cursor.execute("""
                       SELECT MIN(free_capacity)
                       FROM view_schema.view_daily_parking_lot_capacity_and_occupation
                       WHERE date >= %s AND date <= %s
                       """, (start_date, end_date))
        result = cursor.fetchone()
        min_capacity = result[0] if result else None

        print(f"Total capacity from {start_date} to {end_date}: {min_capacity}")
        return int(min_capacity) if min_capacity is not None else 0

    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error in get_total_capacity: {e}")
        raise e


# Function to fetch parking capacities for a specific parking lot ID and time frame
def check_parking_capacity(parking_lot_id, start_date, end_date):
    try:
        cursor.execute("""
                       SELECT capacity
                       FROM parking_lot_capacity
                       WHERE parking_lot_id = %s AND valid_from <= %s AND valid_to >= %s
                       """, (parking_lot_id, start_date, end_date))
        result = cursor.fetchone()
        free_capacity = result[0] if result else None

        print(f"Parking lot {parking_lot_id} capacity from {start_date} to {end_date}: {free_capacity}")
        return int(free_capacity) if free_capacity is not None else 0

    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error in check_parking_capacity: {e}")
        raise e


# Function to assign parking based on demand and available capacity
def assign_parking(lots, demand_cars, demand_busses, demand_trucks, start_date, end_date, assignments, entrance_id):
    assigned_lots = []
    remaining_cars = demand_cars
    remaining_busses = demand_busses
    remaining_trucks = demand_trucks

    # Sort parking lots by distance to entrance
    lots.sort(key=lambda x: distances.get(entrance_id, {}).get(x['id'], float('inf')))

    for lot in lots:
        lot_id = lot['id']
        capacity_check = assignments.get(lot_id, {}).get((start_date, end_date))
        if capacity_check is None:
            capacity_check = check_parking_capacity(lot_id, start_date, end_date)
        free_capacity = capacity_check

        assigned_cars = min(remaining_cars, free_capacity)
        assigned_busses = min(remaining_busses, free_capacity // 3)  # Each bus requires 3 units of capacity
        assigned_trucks = min(remaining_trucks, free_capacity // 4)  # Each truck requires 4 units of capacity

        assignments[lot_id] = assignments.get(lot_id, {})
        assignments[lot_id][(start_date, end_date)] = (
                    free_capacity - assigned_cars - (assigned_busses * 3) - (assigned_trucks * 4))

        assigned_lots.append({
            'parking_lot_id': lot_id,
            'cars_capacity': assigned_cars,
            'busses_capacity': assigned_busses * 3,
            'trucks_capacity': assigned_trucks * 4,
            'distance_to_entrance': distances.get(entrance_id, {}).get(lot_id, float('inf'))
            # Include distance in the assigned result
        })

        remaining_cars -= assigned_cars
        remaining_busses -= assigned_busses
        remaining_trucks -= assigned_trucks

        if remaining_cars <= 0 and remaining_busses <= 0 and remaining_trucks <= 0:
            break

    if remaining_cars > 0 or remaining_busses > 0 or remaining_trucks > 0:
        return f"Error: Not enough capacity to fulfill demand"

    print(f"Assigned parking: {assigned_lots}")
    return assigned_lots


# Function to fetch parking lots based on optional criteria
def get_parking_lots(event_id, phase, phase_start_date, phase_end_date, surface_material=None, service_level=None):
    try:
        params = {'start_date': phase_start_date, 'end_date': phase_end_date}
        query = """
                SELECT pl.id, pl.name
                FROM parking_lot pl
                INNER JOIN parking_lot_capacity plc ON pl.id = plc.parking_lot_id
                WHERE (plc.valid_from <= %(end_date)s AND plc.valid_to >= %(start_date)s)
                """
        if surface_material:
            query += " AND pl.surface_material = %(surface_material)s"
            params['surface_material'] = surface_material
        if service_level:
            query += " AND pl.service_level = %(service_level)s"
            params['service_level'] = service_level

        cursor.execute(query, params)
        parking_lots = cursor.fetchall()

        result = [{'id': row[0], 'name': row[1]} for row in parking_lots]
        print(f"Parking lots fetched: {result}")
        return result

    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error in get_parking_lots: {e}")
        raise e


# Function to read event data from CSV file
def read_event_data_from_csv(filename):
    event_data = []
    with open(filename, 'r', newline='') as csvfile:
        reader = csv.DictReader(csvfile, delimiter=';')
        for row in reader:
            print(f"Reading row: {row}")
            event_data.append({
                'id': int(row['id']),
                'name': row['name'],
                'entrance': row['entrance'],  # Do not capitalize here, handle it in mapping
                'assembly_start_date': datetime.strptime(row['assembly_start_date'], '%Y-%m-%d').date(),
                'assembly_end_date': datetime.strptime(row['assembly_end_date'], '%Y-%m-%d').date(),
                'runtime_start_date': datetime.strptime(row['runtime_start_date'], '%Y-%m-%d').date(),
                'runtime_end_date': datetime.strptime(row['runtime_end_date'], '%Y-%m-%d').date(),
                'disassembly_start_date': datetime.strptime(row['disassembly_start_date'], '%Y-%m-%d').date(),
                'disassembly_end_date': datetime.strptime(row['disassembly_end_date'], '%Y-%m-%d').date(),
                'assembly_demand_cars': int(row['assembly_demand_cars']),
                'assembly_demand_busses': int(row['assembly_demand_busses']),
                'assembly_demand_trucks': int(row['assembly_demand_trucks']),
                'runtime_demand_cars': int(row['runtime_demand_cars']),
                'runtime_demand_busses': int(row['runtime_demand_busses']),
                'runtime_demand_trucks': int(row['runtime_demand_trucks']),
                'disassembly_demand_cars': int(row['disassembly_demand_cars']),
                'disassembly_demand_busses': int(row['disassembly_demand_busses']),
                'disassembly_demand_trucks': int(row['disassembly_demand_trucks'])
            })
    return event_data


# Function to write recommendations and errors to CSV file
def write_recommendations_to_csv(recommendations, errors, filename):
    try:
        with open(filename, 'w', newline='') as csvfile:
            fieldnames = ['event_id', 'event_name', 'phase', 'vehicle_type', 'parking_lot_id', 'assigned_capacity']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()

            for recommendation in recommendations:
                event_id = recommendation['event_id']
                event_name = recommendation['event_name']

                for phase, phase_data in recommendation['recommendations'].items():
                    for vehicle_type, parking_data in phase_data.items():
                        for parking_lot in parking_data:
                            assigned_capacity = parking_lot[f'{vehicle_type}_capacity']
                            if assigned_capacity > 0:  # Only write if assigned capacity is greater than 0
                                writer.writerow({
                                    'event_id': event_id,
                                    'event_name': event_name,
                                    'phase': phase,
                                    'vehicle_type': vehicle_type,
                                    'parking_lot_id': parking_lot['parking_lot_id'],
                                    'assigned_capacity': assigned_capacity
                                })

            # Writing errors section to the CSV
            if errors:
                writer.writerow({})  # Blank row for clarity
                writer.writerow({'Errors': 'Demand exceeds total capacity:'})  # Header for errors section
                error_fieldnames = ['event_id', 'event_name', 'phase', 'error_message']
                error_writer = csv.DictWriter(csvfile, fieldnames=error_fieldnames)
                error_writer.writeheader()

                for error in errors:
                    error_writer.writerow({
                        'event_id': error['event_id'],
                        'event_name': error['event_name'],
                        'phase': error['phase'],
                        'error_message': error['error_message']
                    })

        print(f"Recommendations and errors written to {filename} for verification.")

    except Exception as e:
        print(f"Error writing CSV file: {str(e)}")


# Function to execute the recommendation engine and write results to CSV
def recommendation_engine(event_data):
    try:
        recommendations = []
        errors = []
        assignments = {}

        for event in event_data:
            event_id = event['id']
            event_name = event['name']
            entrance_name = event['entrance']
            entrance_id = get_entrance_id(entrance_name)
            print(f"Processing event {event_id}: {event_name}")

            # Initialize phase recommendations for the current event
            phase_recommendations = {'event_id': event_id, 'event_name': event_name, 'recommendations': {}}

            phases = ['assembly', 'runtime', 'disassembly']

            for phase in phases:
                phase_start_date = event[f'{phase}_start_date']
                phase_end_date = event[f'{phase}_end_date']
                car_demand = int(event[f'{phase}_demand_cars'])
                bus_demand = int(event[f'{phase}_demand_busses'])
                truck_demand = int(event[f'{phase}_demand_trucks'])

                total_capacity = get_total_capacity(phase_start_date, phase_end_date)
                if isinstance(total_capacity, str):
                    errors.append({
                        'event_id': event_id,
                        'event_name': event_name,
                        'phase': phase,
                        'error_message': f"Error: Total capacity returned as string"
                    })
                    continue

                phase_recommendations['recommendations'][phase] = {}

                if car_demand > 0:
                    lots = get_parking_lots(event_id, phase, phase_start_date, phase_end_date)
                    car_assignments = assign_parking(lots, car_demand, 0, 0, phase_start_date, phase_end_date,
                                                     assignments, entrance_id)
                    if isinstance(car_assignments, str):
                        errors.append({
                            'event_id': event_id,
                            'event_name': event_name,
                            'phase': phase,
                            'error_message': car_assignments
                        })
                    else:
                        phase_recommendations['recommendations'][phase]['cars'] = car_assignments

                if bus_demand > 0:
                    lots = get_parking_lots(event_id, phase, phase_start_date, phase_end_date)
                    bus_assignments = assign_parking(lots, 0, bus_demand, 0, phase_start_date, phase_end_date,
                                                     assignments, entrance_id)
                    if isinstance(bus_assignments, str):
                        errors.append({
                            'event_id': event_id,
                            'event_name': event_name,
                            'phase': phase,
                            'error_message': bus_assignments
                        })
                    else:
                        phase_recommendations['recommendations'][phase]['busses'] = bus_assignments

                if truck_demand > 0:
                    lots = get_parking_lots(event_id, phase, phase_start_date, phase_end_date)
                    truck_assignments = assign_parking(lots, 0, 0, truck_demand, phase_start_date, phase_end_date,
                                                       assignments, entrance_id)
                    if isinstance(truck_assignments, str):
                        errors.append({
                            'event_id': event_id,
                            'event_name': event_name,
                            'phase': phase,
                            'error_message': truck_assignments
                        })
                    else:
                        phase_recommendations['recommendations'][phase]['trucks'] = truck_assignments

            recommendations.append(phase_recommendations)

        return recommendations, errors

    except Exception as e:
        print(f"Error in recommendation_engine: {str(e)}")
        raise e


def main():
    try:
        # Read event data from CSV
        event_data = read_event_data_from_csv('..\..\southpark\database\seed\events_data.csv')

        # Run recommendation engine
        recommendations, errors = recommendation_engine(event_data)

        # Write recommendations and errors to CSV for verification
        write_recommendations_to_csv(recommendations, errors, 'recommendations.csv')

        print("Recommendations and errors written to recommendations.csv for verification.")

    except Exception as e:
        print(f"Error: {str(e)}")

    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
