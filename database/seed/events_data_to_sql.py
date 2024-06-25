import numpy as np
import pandas as pd


# Step 1: Load the dataset
def load_dataset(file_path):
    try:
        df = pd.read_csv(file_path, delimiter=";", engine="python")
        print("Dataset loaded successfully.")
        return df
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return None


# Step 2: Clean and preprocess the data
def clean_preprocess_data(df):
    # Drop the 'parking_lot_allocation' column
    if "parking_lot_allocation" in df.columns:
        df.drop(columns=["parking_lot_allocation"], inplace=True)

    # Handle missing values
    df.fillna("", inplace=True)

    # Convert date columns to datetime
    date_columns = [
        "assembly_start_date",
        "assembly_end_date",
        "runtime_start_date",
        "runtime_end_date",
        "disassembly_start_date",
        "disassembly_end_date",
    ]
    for col in date_columns:
        df[col] = pd.to_datetime(df[col], errors="coerce")

    # Ensure hall_id is a string
    df["hall_id"] = df["hall_id"].astype(str)

    # Clean and standardize the entrances column
    entrance_mapping = {
        "north": "North",
        "south": "South",
        "east": "East",
        "west": "West",
        "north_west": "North West",
        "north_east": "North East",
        "south_west": "South West",
        "south_east": "South East",
    }
    df["entrance"] = (
        df["entrance"].map(entrance_mapping).fillna(df["entrance"].str.title())
    )

    # Generate a color for each event chain
    event_colors = {}
    for index, row in df.iterrows():
        current_event_id = row["id"]
        previous_event_id = row["previous_event_id"]
        if previous_event_id and previous_event_id in event_colors:
            df.at[index, "color"] = event_colors[previous_event_id]
        else:
            color = "#{:06x}".format(np.random.randint(0, 0xFFFFFF))
            df.at[index, "color"] = color
            event_colors[current_event_id] = color

    print("Data cleaning and preprocessing completed.")
    return df


# Step 3: Generate SQL insert statements for events
def generate_event_inserts(df):
    event_inserts = []
    for _, row in df.iterrows():
        previous_event = (
            int(row["previous_event_id"]) if row["previous_event_id"] else "NULL"
        )
        event_inserts.append(
            f"INSERT INTO public.event (id, name, assembly_start_date, assembly_end_date, runtime_start_date, runtime_end_date, disassembly_start_date, disassembly_end_date, color, previous_event) VALUES ({row['id']}, '{row['name']}', '{row['assembly_start_date']}', '{row['assembly_end_date']}', '{row['runtime_start_date']}', '{row['runtime_end_date']}', '{row['disassembly_start_date']}', '{row['disassembly_end_date']}', '{row['color']}', {previous_event}) ON CONFLICT DO NOTHING;"
        )
    return event_inserts


# Step 4: Generate SQL insert statements for visitor demand
def generate_visitor_demand_inserts(df):
    visitor_demand_inserts = []
    for _, row in df.iterrows():
        start_date = row["assembly_start_date"]
        end_date = row["disassembly_end_date"]
        dates = pd.date_range(start=start_date, end=end_date)
        for date in dates:
            status = get_status(date, row)
            visitor_demand_inserts.append(
                f"INSERT INTO public.visitor_demand (event_id, date, car_demand, truck_demand, bus_demand, status) VALUES ({row['id']}, '{date.date()}', {row[f'{status}_demand_cars']}, {row[f'{status}_demand_trucks']}, {row[f'{status}_demand_busses']}, '{status}') ON CONFLICT DO NOTHING;"
            )
    return visitor_demand_inserts


def get_status(date, row):
    if date < row["assembly_start_date"]:
        return "early_assembly"
    elif date <= row["assembly_end_date"]:
        return "assembly"
    elif date <= row["runtime_end_date"]:
        return "runtime"
    elif date <= row["disassembly_end_date"]:
        return "disassembly"
    else:
        return "late_disassembly"


# Step 5: Generate SQL insert statements for hall occupations
def generate_hall_occupation_inserts(df):
    hall_occupation_inserts = []
    for _, row in df.iterrows():
        start_date = row["assembly_start_date"]
        end_date = row["disassembly_end_date"]
        dates = pd.date_range(start=start_date, end=end_date)
        halls = row["hall_id"].split(",")
        for date in dates:
            for hall_id in halls:
                hall_occupation_inserts.append(
                    f"INSERT INTO public.hall_occupation (event_id, hall_id, date) VALUES ({row['id']}, {hall_id}, '{date.date()}') ON CONFLICT DO NOTHING;"
                )
    return hall_occupation_inserts


# Step 6: Generate SQL insert statements for entrance occupations
def generate_entrance_occupation_inserts(df):
    entrance_occupation_inserts = []
    for _, row in df.iterrows():
        start_date = row["assembly_start_date"]
        end_date = row["disassembly_end_date"]
        dates = pd.date_range(start=start_date, end=end_date)
        entrances = row["entrance"].split(",")
        for date in dates:
            for entrance in entrances:
                entrance_occupation_inserts.append(
                    f"INSERT INTO public.entrance_occupation (event_id, entrance_id, date) VALUES ({row['id']}, (SELECT id FROM public.entrance WHERE name = '{entrance}'), '{date.date()}') ON CONFLICT DO NOTHING;"
                )
    return entrance_occupation_inserts


# Main function
def main(input_file, output_file):
    df = load_dataset(input_file)
    if df is not None:
        df_cleaned = clean_preprocess_data(df)

        # Print the head of the DataFrame before saving
        print("Head of the cleaned DataFrame:")
        print(df_cleaned.head())

        event_inserts = generate_event_inserts(df_cleaned)
        visitor_demand_inserts = generate_visitor_demand_inserts(df_cleaned)
        hall_occupation_inserts = generate_hall_occupation_inserts(df_cleaned)
        entrance_occupation_inserts = generate_entrance_occupation_inserts(df_cleaned)

        with open(output_file, "w") as file:
            for insert in event_inserts:
                file.write(insert + "\n")
            for insert in visitor_demand_inserts:
                file.write(insert + "\n")
            for insert in hall_occupation_inserts:
                file.write(insert + "\n")
            for insert in entrance_occupation_inserts:
                file.write(insert + "\n")
        print(f"Preprocessed data saved successfully to {output_file}.")


if __name__ == "__main__":
    # Specify the input and output file paths
    input_file = "filtered_events.csv"
    output_file = "filtered_events_data_seed.sql"

    # Run the main function
    main(input_file, output_file)
