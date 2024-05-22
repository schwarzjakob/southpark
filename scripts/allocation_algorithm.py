import pandas as pd
import pulp as pl
import logging
from sqlalchemy import text

# Enabling logging (must come first to enable it globally, also for imported modules and packages)
logger_format = (
    "[%(asctime)s %(filename)s->%(funcName)s():%(lineno)d] %(levelname)s: %(message)s"
)
logging.basicConfig(format=logger_format, level=logging.DEBUG)
logger = logging.getLogger(__name__)


def get_data(query, engine):
    """Fetch data from the database using the provided SQL query."""
    try:
        logger.info(f"Executing query: {query}")
        with engine.connect() as connection:
            result = pd.read_sql_query(query, connection)
        logger.info("Query executed successfully.")
        return result
    except Exception as e:
        logger.error(f"Failed to execute query: {query}", exc_info=True)
        raise e


def fetch_events_parking_lots_min_capacity(engine):
    """Fetch events parking lot data with minimum capacity for the optimization."""
    try:
        logger.info("Fetching data from the database for optimization.")
        query = """
        WITH EventHalls AS (
            SELECT 
                e.id AS event_id, 
                e.name AS event, 
                e.entrance, 
                h.id AS hall_id, 
                h.name AS hall, 
                vd.date AS date, 
                vd.demand, 
                pl.id AS parking_lot_id, 
                pl.name AS parking_lot, 
                pc.capacity, 
                vd.status, 
                CASE 
                    WHEN e.entrance = 'north' THEN hp.distance_north 
                    WHEN e.entrance = 'north_east' THEN hp.distance_north_east 
                    WHEN e.entrance = 'east' THEN hp.distance_east 
                    WHEN e.entrance = 'west' THEN hp.distance_west 
                    WHEN e.entrance = 'north_west' THEN hp.distance_north_west 
                    ELSE 0  -- Handle any other cases or set a default value
                END AS distance 
            FROM 
                public.event e 
                JOIN public.visitor_demand vd ON e.id = vd.event_id 
                JOIN public.hall_occupation ho ON e.id = ho.event_id AND vd.date = ho.date 
                JOIN public.hall h ON ho.hall_id = h.id 
                JOIN public.hall_parking_lot_distances hp ON h.id = hp.hall_id 
                JOIN public.parking_lot pl ON hp.parking_lot_id = pl.id 
                JOIN public.parking_lot_capacity pc ON pl.id = pc.parking_lot_id AND vd.date BETWEEN pc.valid_from AND pc.valid_to 
            WHERE 
                pc.capacity >= vd.demand 
        )
        SELECT 
            event_id, 
            event, 
            entrance, 
            STRING_AGG(DISTINCT hall_id::TEXT, ', ') AS hall_ids,  -- Aggregate distinct hall IDs
            STRING_AGG(DISTINCT hall, ', ') AS halls,  -- Aggregate distinct hall names
            date, 
            demand, 
            parking_lot_id, 
            parking_lot, 
            capacity, 
            status, 
            ROUND(AVG(distance)) AS average_distance  -- Calculate and round the average distance
        FROM 
            EventHalls
        GROUP BY 
            event_id, 
            event, 
            entrance, 
            date, 
            demand, 
            parking_lot_id, 
            parking_lot, 
            capacity, 
            status;
        """
        return get_data(query, engine)
    except Exception as e:
        logger.error("Failed to fetch optimization data", exc_info=True)
        raise e


def optimize_distance(df_events_parking_lot_min_capacity):
    """
    This function optimizes event-to-parking lot allocation to minimize total average distance.
    It takes a DataFrame 'df_events_parking_lot_min_capacity', which includes event details and associated parking lots that meet the event's demand.
    The optimization algorithm assigns each event to a parking lot, aiming to minimize the average distance from the event's halls to the parking lot across all events.
    """

    # Ensure all required columns are present
    required_columns = {
        "event_id",
        "event",
        "date",
        "parking_lot_id",
        "average_distance",
        "demand",
        "capacity",
        "entrance",
        "status",
    }
    if not required_columns.issubset(df_events_parking_lot_min_capacity.columns):
        missing_cols = required_columns - set(
            df_events_parking_lot_min_capacity.columns
        )
        raise ValueError(f"Missing columns in the input DataFrame: {missing_cols}")

    # Log the data to check
    logger.info("Data fetched for optimization:")
    logger.info(df_events_parking_lot_min_capacity.head())

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

    # Objective: Minimize the total average distance
    model += pl.lpSum(
        assignments[(event_id, date, parking_lot_id)] * distance
        for event_id, date, parking_lot_id, distance in df_events_parking_lot_min_capacity[
            ["event_id", "date", "parking_lot_id", "average_distance"]
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

    # Constraint: Ensure parking lots do not change within the assembly, runtime, or disassembly period of an event
    for event_id, event_group in df_events_parking_lot_min_capacity.groupby("event_id"):
        for phase in ["assembly", "runtime", "disassembly"]:
            phase_group = event_group[event_group["status"] == phase]
            if not phase_group.empty:
                first_date = phase_group["date"].min()
                last_date = phase_group["date"].max()
                dates_in_phase = pd.date_range(first_date, last_date).date
                for parking_lot_id in phase_group["parking_lot_id"].unique():
                    valid_dates = [
                        date
                        for date in dates_in_phase
                        if (event_id, date, parking_lot_id) in assignments
                    ]
                    if valid_dates:
                        model += (
                            pl.lpSum(
                                assignments[(event_id, date, parking_lot_id)]
                                for date in valid_dates
                            )
                            == len(valid_dates)
                            * assignments[(event_id, valid_dates[0], parking_lot_id)]
                        )

    # Solve the model
    model.solve()

    # Output results
    df_allocation_results = []
    for (event_id, date, parking_lot_id), var in assignments.items():
        if pl.value(var) == 1:
            allocated_capacity_rows = df_events_parking_lot_min_capacity[
                (df_events_parking_lot_min_capacity["event_id"] == event_id)
                & (df_events_parking_lot_min_capacity["date"] == date)
                & (
                    df_events_parking_lot_min_capacity["parking_lot_id"]
                    == parking_lot_id
                )
            ]
            if not allocated_capacity_rows.empty:
                allocated_capacity = allocated_capacity_rows["capacity"].iloc[0]
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
    logger.info("df_allocation_results:")
    logger.info(df_allocation_results.head())

    # Ensure the DataFrame has the necessary columns before sorting
    if not df_allocation_results.empty:
        df_allocation_results.sort_values(by=["event_id", "date"], inplace=True)

    return df_allocation_results


def save_allocation_results(df_allocation_results, engine):
    """Save the optimized parking lot allocation results to the database."""
    try:
        with engine.begin() as connection:
            logger.info("Clearing previous allocations from the database.")
            connection.execute(text("DELETE FROM parking_lot_allocation;"))

            logger.info("Inserting new allocation results into the database.")
            insert_query = text(
                "INSERT INTO parking_lot_allocation (event_id, parking_lot_id, date, allocated_capacity) VALUES (:event_id, :parking_lot_id, :date, :allocated_capacity)"
            )
            for index, row in df_allocation_results.iterrows():
                connection.execute(
                    insert_query,
                    {
                        "event_id": row["event_id"],
                        "parking_lot_id": row["parking_lot_id"],
                        "date": row["date"],
                        "allocated_capacity": row["allocated_capacity"],
                    },
                )
            logger.info("New allocations successfully saved.")
    except Exception as e:
        logger.error("Failed to save parking lot allocation results", exc_info=True)
        raise e


def fetch_and_optimize_parking_lots(engine):
    """Fetch data, optimize parking lot allocation, and save results."""
    try:
        df_events_parking_lot_min_capacity = fetch_events_parking_lots_min_capacity(
            engine
        )
        if df_events_parking_lot_min_capacity.empty:
            return "No data available to optimize."

        df_allocation_results = optimize_distance(df_events_parking_lot_min_capacity)
        save_allocation_results(df_allocation_results, engine)

        return "Optimization completed and results saved."
    except Exception as e:
        logger.error(
            "Error in fetching, optimizing, or saving parking lot allocations",
            exc_info=True,
        )
        raise e
