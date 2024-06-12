-- Create view schema
CREATE SCHEMA IF NOT EXISTS view_schema;

-- Create the demand vs capacity view
CREATE OR REPLACE VIEW view_schema.view_demand_vs_capacity AS
SELECT
    vd.date,
    SUM(vd.demand) AS total_demand,
    COALESCE((
        SELECT SUM(plc.capacity)
        FROM public.parking_lot_capacity plc
        WHERE vd.date BETWEEN plc.valid_from AND plc.valid_to
    ), 0) AS total_capacity
FROM
    public.visitor_demand vd
GROUP BY
    vd.date
ORDER BY
    vd.date;

-- Create the events parking lots allocation view
CREATE OR REPLACE VIEW view_schema.view_events_parking_lots_allocation AS
SELECT
    event_id,
    event,
    date,
    demand,
    status,
    STRING_AGG(DISTINCT halls, ', ') AS halls,
    parking_lot,
    allocated_capacity,
    distance
FROM (
    SELECT
        pa.event_id AS event_id,
        e.name AS event,
        pa.date AS date,
        vd.demand AS demand,
        vd.status AS status,
        h.name AS halls,
        pl.name AS parking_lot,
        pa.allocated_capacity AS allocated_capacity,
        epd.distance AS distance
    FROM
        public.parking_lot_allocation pa
    JOIN
        public.event e ON pa.event_id = e.id
    JOIN
        public.visitor_demand vd ON pa.event_id = vd.event_id AND pa.date = vd.date -- Joining proper phase onto corresponding day
    JOIN
        public.parking_lot pl ON pa.parking_lot_id = pl.id
    JOIN
        public.hall_occupation ho ON e.id = ho.event_id
    JOIN
        public.hall h ON ho.hall_id = h.id
    LEFT JOIN
        public.entrance_occupation eo ON e.id = eo.event_id
    LEFT JOIN
        public.entrance_parking_lot_distance epd ON eo.entrance_id = epd.entrance_id AND pa.parking_lot_id = epd.parking_lot_id
) AS subquery
GROUP BY
    event_id, event, date, demand, status, parking_lot, allocated_capacity, distance
ORDER BY
    event_id, date;


-- Create the events parking lot minimum capacity view
CREATE OR REPLACE VIEW view_schema.view_events_parking_lot_min_capacity AS
WITH EventHalls AS (
    SELECT 
        e.id AS event_id, 
        e.name AS event, 
        eo.entrance_id, 
        en.name AS entrance, 
        h.id AS hall_id, 
        h.name AS hall, 
        vd.date AS date, 
        vd.demand, 
        pl.id AS parking_lot_id, 
        pl.name AS parking_lot, 
        pc.capacity, 
        vd.status, 
        epd.distance AS distance 
    FROM 
        public.event e 
        JOIN public.visitor_demand vd ON e.id = vd.event_id 
        JOIN public.hall_occupation ho ON e.id = ho.event_id AND vd.date = ho.date 
        JOIN public.hall h ON ho.hall_id = h.id 
        JOIN public.parking_lot pl ON pl.id = pl.id
        JOIN public.parking_lot_capacity pc ON pl.id = pc.parking_lot_id AND vd.date BETWEEN pc.valid_from AND pc.valid_to 
        LEFT JOIN public.entrance_occupation eo ON e.id = eo.event_id AND vd.date = eo.date
        LEFT JOIN public.entrance en ON eo.entrance_id = en.id
        LEFT JOIN public.entrance_parking_lot_distance epd ON eo.entrance_id = epd.entrance_id AND pl.id = epd.parking_lot_id
    WHERE 
        pc.capacity >= vd.demand 
)
SELECT 
    event_id, 
    event, 
    entrance, 
    STRING_AGG(DISTINCT hall_id::TEXT, ', ') AS hall_ids,  
    STRING_AGG(DISTINCT hall, ', ') AS halls,  
    date, 
    demand, 
    parking_lot_id, 
    parking_lot, 
    capacity, 
    status, 
    ROUND(AVG(distance)) AS average_distance  
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

-- Create the events timeline view
CREATE OR REPLACE VIEW view_schema.view_events_timeline AS
SELECT
    e.id AS event_id,
    e.name AS event_name,
    en.name AS event_entrance,
    STRING_AGG(DISTINCT h.name, ', ') AS halls,
    STRING_AGG(DISTINCT CASE WHEN pa.date BETWEEN e.assembly_start_date AND e.assembly_end_date THEN p.name ELSE NULL END, ', ') FILTER (WHERE pa.date BETWEEN e.assembly_start_date AND e.assembly_end_date) AS assembly_parking_lots,
    STRING_AGG(DISTINCT CASE WHEN pa.date BETWEEN e.runtime_start_date AND e.runtime_end_date THEN p.name ELSE NULL END, ', ') FILTER (WHERE pa.date BETWEEN e.runtime_start_date AND e.runtime_end_date) AS runtime_parking_lots,
    STRING_AGG(DISTINCT CASE WHEN pa.date BETWEEN e.disassembly_start_date AND e.disassembly_end_date THEN p.name ELSE NULL END, ', ') FILTER (WHERE pa.date BETWEEN e.disassembly_start_date AND e.disassembly_end_date) AS disassembly_parking_lots,
    MIN(e.assembly_start_date) AS assembly_start_date,
    MAX(e.assembly_end_date) AS assembly_end_date,
    MIN(e.runtime_start_date) AS runtime_start_date,
    MAX(e.runtime_end_date) AS runtime_end_date,
    MIN(e.disassembly_start_date) AS disassembly_start_date,
    MAX(e.disassembly_end_date) AS disassembly_end_date
FROM
    public.event e
JOIN
    public.hall_occupation ho ON e.id = ho.event_id
JOIN
    public.hall h ON ho.hall_id = h.id
LEFT JOIN
    public.parking_lot_allocation pa ON pa.event_id = e.id
LEFT JOIN
    public.parking_lot p ON pa.parking_lot_id = p.id
LEFT JOIN
    public.entrance_occupation eo ON e.id = eo.event_id AND pa.date = eo.date
LEFT JOIN
    public.entrance en ON eo.entrance_id = en.id
GROUP BY
    e.id, e.name, en.name
ORDER BY
    MIN(e.assembly_start_date), MIN(e.runtime_start_date), MIN(e.disassembly_start_date);
