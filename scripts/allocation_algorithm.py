import pandas as pd
import pulp as pl


def optimize_distance(df_events_parking_lot_min_capacity):
    """Optimize the allocation of events to parking lots to minimize the total minimum distance"""

    # Ensure all required columns are present
    required_columns = {
        "event_id",
        "event",
        "date",
        "parking_lot_id",
        "distance",
        "demand",
        "capacity",
    }
    if not required_columns.issubset(df_events_parking_lot_min_capacity.columns):
        missing_cols = required_columns - set(
            df_events_parking_lot_min_capacity.columns
        )
        raise ValueError(f"Missing columns in the input DataFrame: {missing_cols}")

    # Define the problem
    model = pl.LpProblem("Minimize_Distance", pl.LpMinimize)

    # Define decision variables
    assignments = pl.LpVariable.dicts(
        "Assign",
        (
            (event_id, date, parking_lot_id)
            for event_id, date, parking_lot_id in df_events_parking_lot_min_capacity[
                ["event_id", "date", "parking_lot_id"]
            ]
            .drop_duplicates()
            .itertuples(index=False, name=None)
        ),
        cat="Binary",
    )

    # Objective: Minimize the total minimum distance
    model += pl.lpSum(
        assignments[(event_id, date, parking_lot_id)] * distance
        for event_id, date, parking_lot_id, distance in df_events_parking_lot_min_capacity[
            ["event_id", "date", "parking_lot_id", "distance"]
        ].itertuples(
            index=False, name=None
        )
    )

    # Constraint: Each event on each date should have exactly one parking lot assigned
    for (event_id, date), group in df_events_parking_lot_min_capacity.groupby(
        ["event_id", "date"]
    ):
        model += (
            pl.lpSum(
                assignments[(event_id, date, parking_lot_id)]
                for parking_lot_id in group["parking_lot_id"]
            )
            == 1
        )

    # Constraint: Do not exceed the capacity of any parking lot on any given day
    for (parking_lot_id, date), group in df_events_parking_lot_min_capacity.groupby(
        ["parking_lot_id", "date"]
    ):
        model += (
            pl.lpSum(
                assignments[(event_id, date, parking_lot_id)] * demand
                for event_id, demand in group[["event_id", "demand"]].itertuples(
                    index=False, name=None
                )
            )
            <= group["capacity"].iloc[0]
        )

    # Solve the model
    model.solve()

    # Output results
    df_allocation_results = []
    for (event_id, date, parking_lot_id), var in assignments.items():
        if pl.value(var) == 1:
            allocated_capacity = df_events_parking_lot_min_capacity[
                (df_events_parking_lot_min_capacity["event_id"] == event_id)
                & (df_events_parking_lot_min_capacity["date"] == date)
                & (
                    df_events_parking_lot_min_capacity["parking_lot_id"]
                    == parking_lot_id
                )
            ]["capacity"].iloc[0]
            df_allocation_results.append(
                {
                    "event_id": event_id,
                    "date": date,
                    "parking_lot_id": parking_lot_id,
                    "allocated_capacity": allocated_capacity,
                }
            )

    df_allocation_results = pd.DataFrame(df_allocation_results)

    # Log the intermediate results
    print("df_allocation_results \n", df_allocation_results.head(5))

    # Ensure the DataFrame has the necessary columns before sorting
    if not df_allocation_results.empty:
        df_allocation_results.sort_values(by=["event_id", "date"], inplace=True)

    return df_allocation_results
