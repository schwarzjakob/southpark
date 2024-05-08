# Import Libraries
import os
import pandas as pd
import pulp as pl


def optimize_distance(df_events_parking_lot_min_capacity):
    """Optimize the allocation of events to parking lots to minimize the total minimum distance"""

    # Define the problem
    model = pl.LpProblem("Minimize_Distance", pl.LpMinimize)

    # Define decision variables
    assignments = pl.LpVariable.dicts(
        "Assign",
        (
            (event_id, event_name, date, parking_lot)
            for index, (
                event_id,
                event_name,
                date,
                parking_lot,
            ) in df_events_parking_lot_min_capacity[
                ["event_id", "event", "date", "parking_lot"]
            ]
            .drop_duplicates()
            .iterrows()
        ),
        cat="Binary",
    )

    # Objective: Minimize the total minimum distance
    model += pl.lpSum(
        assignments[(event_id, event_name, date, parking_lot)] * distance
        for index, (
            event_id,
            event_name,
            date,
            parking_lot,
            distance,
        ) in df_events_parking_lot_min_capacity[
            ["event_id", "event", "date", "parking_lot", "distance"]
        ].iterrows()
    )

    # Constraint: Each event on each date should have exactly one parking lot assigned
    for (
        event_id,
        event_name,
        date,
    ), group in df_events_parking_lot_min_capacity.groupby(
        ["event_id", "event", "date"]
    ):
        model += (
            pl.lpSum(
                assignments[(event_id, event_name, date, parking_lot)]
                for parking_lot in group["parking_lot"]
            )
            == 1
        )

    # Constraint: Do not exceed the capacity of any parking lot on any given day
    for (
        parking_lot,
        date,
    ), group in df_events_parking_lot_min_capacity.groupby(["parking_lot", "date"]):
        model += (
            pl.lpSum(
                assignments[(event_id, event_name, date, parking_lot)] * demand
                for index, (event_id, event_name, demand) in group[
                    ["event_id", "event", "demand"]
                ].iterrows()
            )
            <= group["capacity"].iloc[0]
        )

    # Solve the model
    model.solve()

    # Output results
    df_allocation_results = []
    for (event_id, event_name, date, parking_lot), var in assignments.items():
        if pl.value(var) == 1:
            df_allocation_results.append(
                {
                    "event_id": event_id,
                    "event_name": event_name,
                    "date": date,
                    "parking_lot": parking_lot,
                }
            )

    df_allocation_results = pd.DataFrame(df_allocation_results)

    # Merge capacity onto df_allocation_results
    df_allocation_results = df_allocation_results.merge(
        df_events_parking_lot_min_capacity[["parking_lot"]].drop_duplicates(),
        on="parking_lot",
    )

    return df_allocation_results


if __name__ == "__main__":
    app.run(debug=True)
