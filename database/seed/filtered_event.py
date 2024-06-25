from datetime import datetime, timedelta

import pandas as pd

# Read the CSV file
df = pd.read_csv("events_data.csv", sep=";")

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
    df[col] = pd.to_datetime(df[col])


# Function to check if phases are linked
def phases_linked(row):
    if row["assembly_end_date"] + timedelta(days=1) == row["runtime_start_date"]:
        return True
    if row["runtime_end_date"] + timedelta(days=1) == row["disassembly_start_date"]:
        return True
    return False


# Function to check if any phase is longer than 20 days
def phase_too_long(row):
    if (row["assembly_end_date"] - row["assembly_start_date"]).days > 20:
        return True
    if (row["runtime_end_date"] - row["runtime_start_date"]).days > 20:
        return True
    if (row["disassembly_end_date"] - row["disassembly_start_date"]).days > 20:
        return True
    return False


# Apply filters
df_filtered = df[df.apply(phases_linked, axis=1)]
df_filtered = df_filtered[~df_filtered.apply(phase_too_long, axis=1)]

# Find filtered-out event IDs
filtered_out_ids = df[~df.index.isin(df_filtered.index)]["id"]

# Save both original and filtered dataframes to CSV
df.to_csv("original_events.csv", sep=";", index=False)
df_filtered.to_csv("filtered_events.csv", sep=";", index=False)
filtered_out_ids.to_csv(
    "filtered_out_event_ids.csv", sep=";", index=False, header=["id"]
)

print(f"Original data: {len(df)} events")
print(f"Filtered data: {len(df_filtered)} events")
print(f"Filtered out event IDs: {len(filtered_out_ids)}")
print("Data saved to 'original_events.csv' and 'filtered_events.csv'.")
