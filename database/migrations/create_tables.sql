-- Tables
CREATE TABLE public.hall (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    coordinates FLOAT8[]
);

CREATE TABLE public.event (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    early_assembly_start_date DATE,
    early_assembly_end_date DATE,
    assembly_start_date DATE NOT NULL,
    assembly_end_date DATE NOT NULL,
    runtime_start_date DATE NOT NULL,
    runtime_end_date DATE NOT NULL,
    disassembly_start_date DATE NOT NULL,
    disassembly_end_date DATE NOT NULL,
    late_disassembly_start_date DATE,
    late_disassembly_end_date DATE,
    color VARCHAR(7),
    previous_event INTEGER REFERENCES public.event(id)
);

CREATE TABLE public.hall_occupation (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES public.event(id),
    hall_id INTEGER NOT NULL REFERENCES public.hall(id),
    date DATE NOT NULL,
    UNIQUE(event_id, hall_id, date)
);

CREATE TABLE public.visitor_demand (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES public.event(id),
    date DATE NOT NULL,
    demand INTEGER NOT NULL,
    car_demand INTEGER NOT NULL,
    truck_demand INTEGER NOT NULL,
    bus_demand INTEGER NOT NULL,
    status VARCHAR(50) CHECK (status IN ('early_assembly', 'assembly', 'runtime', 'disassembly', 'late_disassembly')) NOT NULL
);

CREATE TABLE public.parking_lot (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    service_toilets BOOLEAN,
    surface_material VARCHAR(50),
    service_shelter BOOLEAN,
    pricing VARCHAR(50) CHECK (pricing IN ('low', 'medium', 'high')),
    external BOOLEAN,
    coordinates FLOAT8[]
);

CREATE TABLE public.parking_lot_capacity (
    id SERIAL PRIMARY KEY,
    parking_lot_id INTEGER NOT NULL REFERENCES public.parking_lot(id),
    capacity INTEGER NOT NULL,
    utilization_type VARCHAR(50) CHECK (utilization_type IN ('parking', 'event', 'construction', 'other')) NOT NULL,
    truck_limit INTEGER NOT NULL,
    bus_limit INTEGER NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL
);

CREATE TABLE public.parking_lot_allocation (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES public.event(id),
    parking_lot_id INTEGER NOT NULL REFERENCES public.parking_lot(id),
    date DATE NOT NULL,
    allocated_cars INTEGER NOT NULL,
    allocated_trucks INTEGER NOT NULL,
    allocated_buses INTEGER NOT NULL,
    allocated_capacity INTEGER GENERATED ALWAYS AS (allocated_cars + 4 * allocated_trucks + 3 * allocated_buses) STORED
);

CREATE TABLE public.entrance (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    coordinates FLOAT8[]
);

CREATE TABLE public.entrance_occupation (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES public.event(id),
    entrance_id INTEGER NOT NULL REFERENCES public.entrance(id),
    date DATE NOT NULL,
    UNIQUE(event_id, entrance_id, date)
);

CREATE TABLE public.entrance_parking_lot_distance (
    id SERIAL PRIMARY KEY,
    entrance_id INTEGER NOT NULL REFERENCES public.entrance(id),
    parking_lot_id INTEGER NOT NULL REFERENCES public.parking_lot(id),
    distance INTEGER,
    CONSTRAINT unique_entrance_parking_lot_pair UNIQUE (entrance_id, parking_lot_id)
);

-- Triggers
CREATE OR REPLACE FUNCTION check_date_within_event_period() RETURNS TRIGGER AS $$
BEGIN
    IF NOT (
        NEW.date BETWEEN COALESCE((SELECT early_assembly_start_date FROM public.event WHERE id = NEW.event_id), (SELECT assembly_start_date FROM public.event WHERE id = NEW.event_id))
        AND COALESCE((SELECT late_disassembly_end_date FROM public.event WHERE id = NEW.event_id), (SELECT disassembly_end_date FROM public.event WHERE id = NEW.event_id))
    ) THEN
        RAISE EXCEPTION 'Date out of event period';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_allocation_within_capacity() RETURNS TRIGGER AS $$
DECLARE
    total_allocated_capacity INTEGER;
    available_capacity INTEGER;
BEGIN
    SELECT SUM(allocated_capacity)
    INTO total_allocated_capacity
    FROM public.parking_lot_allocation
    WHERE parking_lot_id = NEW.parking_lot_id
    AND date = NEW.date
    AND event_id != NEW.event_id;

    SELECT capacity INTO available_capacity
    FROM public.parking_lot_capacity
    WHERE parking_lot_id = NEW.parking_lot_id
    AND valid_from <= NEW.date
    AND valid_to >= NEW.date;

    IF (total_allocated_capacity + NEW.allocated_capacity) > available_capacity THEN
        RAISE EXCEPTION 'Allocated capacity exceeds the available capacity for parking_lot_id: %, date: %, total_allocated: %, new_allocation: %, available_capacity: %', 
            NEW.parking_lot_id, NEW.date, total_allocated_capacity, NEW.allocated_capacity, available_capacity;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_date_within_event_period
BEFORE INSERT OR UPDATE ON public.visitor_demand
FOR EACH ROW EXECUTE FUNCTION check_date_within_event_period();

CREATE TRIGGER trg_check_allocation_within_capacity
BEFORE INSERT OR UPDATE ON public.parking_lot_allocation
FOR EACH ROW EXECUTE FUNCTION check_allocation_within_capacity();

-- Indexes for performance improvements
CREATE INDEX idx_event_id ON public.hall_occupation(event_id);
CREATE INDEX idx_hall_id ON public.hall_occupation(hall_id);
CREATE INDEX idx_visitor_demand_event_id ON public.visitor_demand(event_id);
CREATE INDEX idx_parking_lot_capacity_parking_lot_id ON public.parking_lot_capacity(parking_lot_id);
CREATE INDEX idx_parking_lot_allocation_event_id ON public.parking_lot_allocation(event_id);
CREATE INDEX idx_parking_lot_allocation_parking_lot_id ON public.parking_lot_allocation(parking_lot_id);
CREATE INDEX idx_entrance_id ON public.entrance_parking_lot_distance(entrance_id);
CREATE INDEX idx_parking_lot_id ON public.entrance_parking_lot_distance(parking_lot_id);
