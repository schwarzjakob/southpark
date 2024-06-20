from datetime import datetime
from extensions import db

class Event(db.Model):
    __tablename__ = 'event'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    entrance = db.Column(db.String, nullable=True)
    assembly_start_date = db.Column(db.Date, nullable=False)
    assembly_end_date = db.Column(db.Date, nullable=False)
    runtime_start_date = db.Column(db.Date, nullable=False)
    runtime_end_date = db.Column(db.Date, nullable=False)
    disassembly_start_date = db.Column(db.Date, nullable=False)
    disassembly_end_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class VisitorDemand(db.Model):
    __tablename__ = 'visitor_demand'
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'))
    date = db.Column(db.Date, nullable=False)
    demand = db.Column(db.Integer, nullable=False)
    car_demand = db.Column(db.Integer, nullable=True)
    truck_demand = db.Column(db.Integer, nullable=True)
    bus_demand = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    event = db.relationship('Event', backref=db.backref('visitor_demands', lazy=True))

class Hall(db.Model):
    __tablename__ = 'hall'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    coordinates = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class HallOccupation(db.Model):
    __tablename__ = 'hall_occupation'
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), primary_key=True)
    hall_id = db.Column(db.Integer, db.ForeignKey('hall.id'), primary_key=True)
    date = db.Column(db.Date, nullable=False, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    event = db.relationship('Event', backref=db.backref('hall_occupations', lazy=True))
    hall = db.relationship('Hall', backref=db.backref('hall_occupations', lazy=True))

class Entrance(db.Model):
    __tablename__ = 'entrance'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    coordinates = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class EntranceOccupation(db.Model):
    __tablename__ = 'entrance_occupation'
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), primary_key=True)
    entrance_id = db.Column(db.Integer, db.ForeignKey('entrance.id'), primary_key=True)
    date = db.Column(db.Date, nullable=False, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    event = db.relationship('Event', backref=db.backref('entrance_occupations', lazy=True))
    entrance = db.relationship('Entrance', backref=db.backref('entrance_occupations', lazy=True))

class ParkingLot(db.Model):
    __tablename__ = 'parking_lot'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    service_toilets = db.Column(db.Boolean, nullable=True)
    surface_material = db.Column(db.String, nullable=True)
    service_shelter = db.Column(db.Boolean, nullable=True)
    pricing = db.Column(db.Float, nullable=True)
    external = db.Column(db.Boolean, nullable=True)
    coordinates = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ParkingLotCapacity(db.Model):
    __tablename__ = 'parking_lot_capacity'
    id = db.Column(db.Integer, primary_key=True)
    parking_lot_id = db.Column(db.Integer, db.ForeignKey('parking_lot.id'))
    capacity = db.Column(db.Integer, nullable=False)
    utilization_type = db.Column(db.String, nullable=True)
    truck_limit = db.Column(db.Integer, nullable=True)
    bus_limit = db.Column(db.Integer, nullable=True)
    valid_from = db.Column(db.Date, nullable=False)
    valid_to = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    parking_lot = db.relationship('ParkingLot', backref=db.backref('capacities', lazy=True))
