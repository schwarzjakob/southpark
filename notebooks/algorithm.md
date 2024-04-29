# Algorithm 1

Here is a Markdown-ready documentation for your optimization algorithm that you can use for documentation or reporting purposes:

## Parking Lot Assignment Optimization Algorithm

The goal of this optimization algorithm is to assign parking lots to events on specific dates, such that the total minimum distance between the event venues and the parking lots is minimized, while ensuring that each event on each date has exactly one parking lot assigned, and that the assigned parking lot can accommodate the demand without exceeding its capacity.

### Model Definition

1. **Objective Function**:
   - Minimize the total minimum distance between event venues and assigned parking lots. This is achieved by summing up the products of binary decision variables and the minimum distances from the event to the parking lots.

   $$
   Minimize \sum_{event, date, parking\_lot} (Assign_{event, date, parking\_lot} \times min\_distance_{event, date, parking\_lot})
   $$

2. **Constraints**:
   - **Unique Parking Assignment**:
     Every event on each date must have exactly one parking lot assigned. This ensures that no event is left without a parking space, and no event is assigned multiple parking lots on the same day.

     $$
     \sum_{parking\_lot \in P(event, date)} Assign_{event, date, parking\_lot} = 1 \quad \forall event, date
     $$
     where \( P(event, date) \) is the set of parking lots available for the event on that particular date.

   - **Capacity Constraint**:
     The total demand of all events assigned to a parking lot on any given day must not exceed the capacity of the parking lot. This ensures that the parking lot can accommodate all the vehicles expected on that day.

     $$
     \sum_{event \in E(parking\_lot, date)} (Assign_{event, date, parking\_lot} \times demand_{event, date}) \leq capacity_{parking\_lot, date} \quad \forall parking\_lot, date
     $$
     where \( E(parking\_lot, date) \) is the set of events assigned to the parking lot on that date.

### Solving the Model

The model is solved using a linear programming solver that determines the values for the binary decision variables \( Assign_{event, date, parking\_lot} \). These variables indicate whether a parking lot is assigned to an event on a particular date (1 if assigned, 0 otherwise).

### Output

The output of the model is a DataFrame that lists each event along with its corresponding date and the assigned parking lot. This DataFrame is then merged with the parking lot capacity data to provide a complete overview of the assignments along with the parking lot capacities.

## Algorithm 2: Advanced Parking Lot Assignment Optimization

The advanced optimization algorithm is designed to allocate parking lots to events on specific dates, with an additional constraint that only parking lots that can meet the maximum demand for each event are considered. This is to ensure that each event is matched with a parking lot capable of accommodating its highest anticipated demand.

### Model Definition

1. **Objective Function**:
   - Minimize the total minimum distance between event venues and assigned parking lots. The function is computed as the sum of the products of binary decision variables and the minimum distances from the events to the parking lots where the parking lot's capacity meets or exceeds the maximum demand of the event.

   $$
   Minimize \sum_{event, parking\_lot} (Assign_{event, parking\_lot} \times \sum_{min\_distance} min\_distance_{event, parking\_lot})
   $$

2. **Constraints**:
   - **Unique Parking Assignment**:
     Each event must have exactly one parking lot assigned that meets its maximum demand. This ensures appropriate capacity handling and simplifies the logistical arrangements.

     $$
     \sum_{parking\_lot \in P(event)} Assign_{event, parking\_lot} = 1 \quad \forall event
     $$
     where \( P(event) \) represents the set of parking lots whose capacities can accommodate the maximum demand of the event.

   - **Capacity Constraint**:
     On any given day, the total demand of all events assigned to each parking lot should not exceed its capacity. This is crucial to avoid overbooking of parking facilities.

     $$
     \sum_{event, date \in D(parking\_lot, date)} (Assign_{event, parking\_lot} \times demand_{event, date}) \leq capacity_{parking\_lot} \quad \forall parking\_lot, date
     $$
     where \( D(parking\_lot, date) \) includes all events assigned to that parking lot on each date.

### Solving the Model

The model employs a linear programming solver to optimize the assignments. The solver determines the values for the binary decision variables \( Assign_{event, parking\_lot} \), where 1 indicates an assignment and 0 indicates no assignment.

### Output

The resulting output is a DataFrame detailing the event, date, and the parking lot assigned to each. The DataFrame is useful for operational planning and ensures all events have adequate parking solutions without exceeding the venue capacities.

By integrating this algorithm into the event planning process, organizations can streamline logistics, reduce transportation costs, and enhance attendee satisfaction by ensuring convenient parking availability.

---

Feel free to adjust the LaTeX and descriptions to match your specific Markdown viewer or documentation standards. This formulation provides a clear overview of the algorithm's purpose, its mathematical basis, and its practical output.

### Algorithm 3

- Include Gates in input data (this is predefinded according to Peter)
- Parking lots should be the same during each assembly period, running period, and dissassembly period but not over the entire three periods.