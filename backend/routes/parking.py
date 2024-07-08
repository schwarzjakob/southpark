from flask import Blueprint, jsonify, request
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from extensions import db
from utils.helpers import get_data
import logging
from functools import wraps
from routes.auth import check_edit_rights

parking_bp = Blueprint("parking", __name__)
logger = logging.getLogger(__name__)


@parking_bp.route("/spaces", methods=["GET"])
def get_parking_spaces():
    try:
        query = """
        SELECT id, name, service_toilets, surface_material, service_shelter, pricing, external
        FROM public.parking_lot
        """
        parking_spaces = get_data(query).to_dict(orient="records")
        return jsonify(parking_spaces), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@parking_bp.route("/space/<int:id>", methods=["GET"])
def get_parking_space(id):
    try:
        with db.engine.begin() as connection:
            query = """
            SELECT id, name, service_toilets, surface_material, service_shelter, pricing, external, coordinates
            FROM public.parking_lot
            WHERE id = :id
            """
            result = connection.execute(text(query), {"id": id})
            parking_space = result.fetchone()

            if parking_space is None:
                return jsonify({"error": "Parking space not found."}), 404

            parking_space_dict = {
                "id": parking_space[0],
                "name": parking_space[1],
                "service_toilets": parking_space[2],
                "surface_material": parking_space[3],
                "service_shelter": parking_space[4],
                "pricing": parking_space[5],
                "external": parking_space[6],
                "coordinates": parking_space[7],
            }

            return jsonify(parking_space_dict), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@parking_bp.route("/space", methods=["POST"])
@check_edit_rights
def add_parking_space():
    try:
        data = request.json
        name = data.get("name")
        service_toilets = data.get("service_toilets", False)
        surface_material = data.get("surface_material")
        service_shelter = data.get("service_shelter", False)
        pricing = data.get("pricing")
        external = data.get("external", False)
        coordinates = [0, 0]

        with db.engine.begin() as connection:
            max_id_result = connection.execute(
                text("SELECT MAX(id) FROM public.parking_lot")
            )
            max_id = max_id_result.scalar() or 0
            new_id = max_id + 1

            query = """
            INSERT INTO public.parking_lot (id, name, service_toilets, surface_material, service_shelter, pricing, external, coordinates)
            VALUES (:id, :name, :service_toilets, :surface_material, :service_shelter, :pricing, :external, :coordinates)
            RETURNING id
            """
            params = {
                "id": new_id,
                "name": name,
                "service_toilets": service_toilets,
                "surface_material": surface_material,
                "service_shelter": service_shelter,
                "pricing": pricing,
                "external": external,
                "coordinates": coordinates,
            }

            result = connection.execute(text(query), params)
            parking_lot_id = result.fetchone()[0]

        return (
            jsonify(
                {"message": "Parking space added successfully", "id": parking_lot_id}
            ),
            201,
        )
    except IntegrityError as e:
        if "unique constraint" in str(e.orig):
            return (
                jsonify({"error": "Parking space with this name already exists."}),
                400,
            )
        else:
            return jsonify({"error": "Integrity error occurred."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@parking_bp.route("/space/<int:id>", methods=["PUT"])
@check_edit_rights
def edit_parking_space(id):
    try:
        data = request.json
        name = data.get("name")
        service_toilets = data.get("service_toilets", False)
        surface_material = data.get("surface_material")
        service_shelter = data.get("service_shelter", False)
        pricing = data.get("pricing")
        external = data.get("external", False)
        coordinates = data.get("coordinates")

        with db.engine.begin() as connection:
            query = """
            UPDATE public.parking_lot
            SET name = :name,
                service_toilets = :service_toilets,
                surface_material = :surface_material,
                service_shelter = :service_shelter,
                pricing = :pricing,
                external = :external,
                coordinates = :coordinates
            WHERE id = :id
            RETURNING id
            """
            params = {
                "id": id,
                "name": name,
                "service_toilets": service_toilets,
                "surface_material": surface_material,
                "service_shelter": service_shelter,
                "pricing": pricing,
                "external": external,
                "coordinates": coordinates,
            }

            result = connection.execute(text(query), params)
            parking_lot_id = result.fetchone()[0]

        return (
            jsonify(
                {"message": "Parking space updated successfully", "id": parking_lot_id}
            ),
            200,
        )
    except IntegrityError as e:
        if "unique constraint" in str(e.orig):
            return (
                jsonify({"error": "Parking space with this name already exists."}),
                400,
            )
        else:
            return jsonify({"error": "Integrity error occurred."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@parking_bp.route("/capacities/<int:parking_lot_id>", methods=["GET"])
def get_parking_space_capacities(parking_lot_id):
    """
    Endpoint to retrieve all capacity entries for a given parking lot ID.
    """
    try:
        query = """
        SELECT id, parking_lot_id, capacity, utilization_type, truck_limit, bus_limit, valid_from, valid_to
        FROM public.parking_lot_capacity
        WHERE parking_lot_id = :parking_lot_id
        """
        params = {"parking_lot_id": parking_lot_id}

        capacities = get_data(query, params).to_dict(orient="records")

        if not capacities:
            return jsonify({"message": "No capacities found"}), 204

        return jsonify(capacities), 200
    except Exception as e:
        logger.error("Failed to fetch capacities", exc_info=True)
        return jsonify({"error": str(e)}), 500


@parking_bp.route("/capacities/<int:parking_lot_id>", methods=["POST"])
@check_edit_rights
def add_parking_space_capacity(parking_lot_id):
    try:
        data = request.json
        capacity = data.get("capacity")
        utilization_type = data.get("utilization_type")
        truck_limit = data.get("truck_limit")
        bus_limit = data.get("bus_limit")
        valid_from = data.get("valid_from")
        valid_to = data.get("valid_to")

        with db.engine.begin() as connection:
            max_id_result = connection.execute(
                text("SELECT MAX(id) FROM public.parking_lot_capacity")
            )
            max_id = max_id_result.scalar() or 0
            new_id = max_id + 1

            query = """
            INSERT INTO public.parking_lot_capacity (
                id, parking_lot_id, capacity, utilization_type, truck_limit, bus_limit, valid_from, valid_to
            ) VALUES (
                :id, :parking_lot_id, :capacity, :utilization_type, :truck_limit, :bus_limit, :valid_from, :valid_to
            )
            RETURNING id
            """
            params = {
                "id": new_id,
                "parking_lot_id": parking_lot_id,
                "capacity": capacity,
                "utilization_type": utilization_type,
                "truck_limit": truck_limit,
                "bus_limit": bus_limit,
                "valid_from": valid_from,
                "valid_to": valid_to,
            }

            result = connection.execute(text(query), params)
            capacity_id = result.fetchone()[0]

        return (
            jsonify({"message": "New capacity added successfully", "id": capacity_id}),
            201,
        )
    except IntegrityError as e:
        if "unique constraint" in str(e.orig):
            return (
                jsonify({"error": "A capacity entry with this ID already exists."}),
                400,
            )
        else:
            return jsonify({"error": "Integrity error occurred."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@parking_bp.route("/capacities/<int:capacity_id>", methods=["PUT"])
@check_edit_rights
def edit_parking_space_capacity(capacity_id):
    try:
        data = request.get_json()
        query = """
        UPDATE public.parking_lot_capacity
        SET capacity = :capacity,
            utilization_type = :utilization_type,
            truck_limit = :truck_limit,
            bus_limit = :bus_limit,
            valid_from = :valid_from,
            valid_to = :valid_to
        WHERE id = :capacity_id
        """
        params = {
            "capacity": data["capacity"],
            "utilization_type": data["utilization_type"],
            "truck_limit": data["truck_limit"],
            "bus_limit": data["bus_limit"],
            "valid_from": data["valid_from"],
            "valid_to": data["valid_to"],
            "capacity_id": capacity_id,
        }

        with db.engine.connect() as connection:
            connection.execute(text(query), params)
            connection.commit()

        return jsonify({"message": "Capacity updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@parking_bp.route("/capacities/<int:capacity_id>", methods=["DELETE"])
@check_edit_rights
def delete_parking_space_capacity(capacity_id):
    try:
        query = """
        DELETE FROM public.parking_lot_capacity
        WHERE id = :capacity_id
        """
        params = {"capacity_id": capacity_id}

        with db.engine.connect() as connection:
            connection.execute(text(query), params)
            connection.commit()

        return jsonify({"message": "Capacity deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@parking_bp.route("/occupations/<int:parking_lot_id>", methods=["GET"])
def get_parking_space_occupations(parking_lot_id):
    """
    Endpoint to retrieve parking space allocations for a given parking lot ID.
    """
    try:
        query = """
        SELECT a.id, a.date, a.allocated_cars, a.allocated_trucks, a.allocated_buses,
               c.capacity AS total_capacity,
               (a.allocated_cars + 4 * a.allocated_trucks + 3 * a.allocated_buses) AS allocated_capacity,
               e.id AS event_id, e.name AS event_name, e.color AS event_color
        FROM public.parking_lot_allocation a
        JOIN public.parking_lot_capacity c ON a.parking_lot_id = c.parking_lot_id
        JOIN public.event e ON a.event_id = e.id
        WHERE a.parking_lot_id = :parking_lot_id
        AND a.date BETWEEN c.valid_from AND c.valid_to
        ORDER BY a.date ASC
        """
        params = {"parking_lot_id": parking_lot_id}
        allocations = get_data(query, params).to_dict(orient="records")

        if not allocations:
            return jsonify({"message": "No allocations found"}), 204

        return jsonify(allocations), 200
    except Exception as e:
        logger.error("Failed to fetch allocations", exc_info=True)
        return jsonify({"error": str(e)}), 500
