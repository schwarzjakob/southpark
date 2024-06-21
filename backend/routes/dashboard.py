import logging
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from sqlalchemy import text
from utils.helpers import get_data

dashboard_bp = Blueprint("dashboard", __name__)
logger = logging.getLogger(__name__)


@dashboard_bp.route("/capacity_utilization", methods=["GET"])
def get_capacity_utilization():
    try:
        year = request.args.get("year", default=datetime.now().year, type=int)
        start_date = request.args.get("start_date", default=f"{year}-01-01", type=str)
        end_date = request.args.get("end_date", default=f"{year}-12-31", type=str)

        query_total_capacity_utilization = f"""
        SELECT date, total_demand, COALESCE(total_capacity, 1) AS total_capacity
        FROM view_schema.view_demand_vs_capacity
        WHERE date BETWEEN '{start_date}' AND '{end_date}'
        ORDER BY date;
        """
        total_capacity_utilization = get_data(query_total_capacity_utilization)

        query_events_per_day = f"""
        SELECT vd.date, vd.event_id, vd.demand AS capacity, e.name AS event_name, e.color AS event_color
        FROM public.visitor_demand vd
        JOIN public.event e ON vd.event_id = e.id
        ORDER BY vd.date, vd.event_id;
        """
        events_per_day = get_data(query_events_per_day)
        events_dict = {}
        for _, row in events_per_day.iterrows():
            date = row["date"].strftime("%Y-%m-%d")
            if date not in events_dict:
                events_dict[date] = {}
            if row["event_id"] not in events_dict[date]:
                events_dict[date][row["event_id"]] = {
                    "event_id": row["event_id"],
                    "event_name": row["event_name"],
                    "capacity": 0,
                    "event_color": row["event_color"],
                }
            events_dict[date][row["event_id"]]["capacity"] += row["capacity"]

        data = []
        for _, row in total_capacity_utilization.iterrows():
            date_str = row["date"].strftime("%Y-%m-%d")
            data.append(
                {
                    "date": date_str,
                    "total_demand": row["total_demand"],
                    "total_capacity": row["total_capacity"],
                    "events": list(events_dict.get(date_str, {}).values()),
                }
            )

        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dashboard_bp.route("/capacity_utilization_critical_days/<int:year>", methods=["GET"])
def capacity_utilization_critical_days(year):
    try:
        start_date = f"{year}-01-01"
        end_date = f"{year}-12-31"

        query = f"""
        SELECT date, total_demand, total_capacity
        FROM view_schema.view_demand_vs_capacity
        WHERE date BETWEEN '{start_date}' AND '{end_date}'
        ORDER BY date;
        """
        data = get_data(query)

        monthly_data = {}

        for _, row in data.iterrows():
            date = row["date"]
            month = date.strftime("%Y-%m")
            if month not in monthly_data:
                monthly_data[month] = {
                    "above_100": {"count": 0, "dates": []},
                    "between_80_and_100": {"count": 0, "dates": []},
                }

            demand = row["total_demand"]
            capacity = row["total_capacity"]
            if 0.8 * capacity <= demand <= capacity:
                monthly_data[month]["between_80_and_100"]["count"] += 1
                monthly_data[month]["between_80_and_100"]["dates"].append(
                    date.strftime("%Y-%m-%d")
                )
            elif demand > capacity:
                monthly_data[month]["above_100"]["count"] += 1
                monthly_data[month]["above_100"]["dates"].append(
                    date.strftime("%Y-%m-%d")
                )

        return jsonify(monthly_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dashboard_bp.route("/total_capacity", methods=["GET"])
def total_capacity():
    try:
        start_date_str = request.args.get("start_date")
        end_date_str = request.args.get("end_date")

        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()

        query = """
        SELECT id, parking_lot_id, capacity, valid_from, valid_to
        FROM public.parking_lot_capacity
        """

        result = get_data(query)
        capacity_data = result.to_dict(orient="records")

        total_capacities = []
        current_date = start_date
        while current_date <= end_date:
            total_capacity = sum(
                entry["capacity"]
                for entry in capacity_data
                if entry["valid_from"] <= current_date <= entry["valid_to"]
            )
            total_capacities.append(
                {
                    "day": current_date.strftime("%Y-%m-%d"),
                    "total_capacity": total_capacity,
                }
            )
            current_date += timedelta(days=1)

        return jsonify(total_capacities), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
