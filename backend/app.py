import sys
import os
from flask import Flask, jsonify, request
import logging
import pandas as pd

# Append the directory above 'backend' to the path to access the 'scripts' directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import allocation_algorithm module and its functions
from scripts.allocation_algorithm import load_data, optimize_distance

# Enabling logging (must come first to enable it globally, also for imported modules and packages)
logger_format = (
    "[%(asctime)s %(filename)s->%(funcName)s():%(lineno)d] %(levelname)s: %(message)s"
)
logging.basicConfig(format=logger_format, level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)


@app.route("/run_optimization", methods=["POST"])
def run_optimization():
    try:
        df_events_parking_lot_min_capacity = load_data()
        df_allocation_results = optimize_distance(df_events_parking_lot_min_capacity)
        return jsonify(df_allocation_results.head().to_dict(orient="records"))
    except Exception as e:
        logger.error("Failed to run optimization", exc_info=True)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.config["DEBUG"] = True
    app.run()
