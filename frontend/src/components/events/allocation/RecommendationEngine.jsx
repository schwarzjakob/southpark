import { useEffect, useState } from "react";
import axios from "axios";

const RecommendationEngine = (eventId) => {
  const [eventData, setEventData] = useState(null);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await axios.post("/api/recommendation/engine", {
          id: eventId,
        });
        const data = response.data;
        setEventData(data);
      } catch (error) {
        console.error("Error fetching event data:", error);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventData) return;

    const transformData = (data) => {
      const transformed = {
        assembly: {},
        runtime: {},
        disassembly: {},
      };

      data.assembly.cars.forEach((item) => {
        transformed.assembly[`PN${item.parking_lot_id}`] = {
          cars: item.capacity,
          buses: 0,
          trucks: 0,
          allocation_id: generateAllocationId(),
          parking_lot_id: item.parking_lot_id,
          parking_lot_name: `PN${item.parking_lot_id}`,
        };
      });

      data.runtime.cars.forEach((item) => {
        transformed.runtime[`PN${item.parking_lot_id}`] = {
          cars: item.capacity,
          buses: 0,
          trucks: 0,
          allocation_id: generateAllocationId(),
          parking_lot_id: item.parking_lot_id,
          parking_lot_name: `PN${item.parking_lot_id}`,
        };
      });

      data.disassembly.cars.forEach((item) => {
        transformed.disassembly[`PN${item.parking_lot_id}`] = {
          cars: item.capacity,
          buses: 0,
          trucks: 0,
          allocation_id: generateAllocationId(),
          parking_lot_id: item.parking_lot_id,
          parking_lot_name: `PN${item.parking_lot_id}`,
        };
      });

      data.assembly.busses.forEach((item) => {
        if (!transformed.assembly[`PN${item.parking_lot_id}`]) {
          transformed.assembly[`PN${item.parking_lot_id}`] = {
            cars: 0,
            buses: item.capacity,
            trucks: 0,
            allocation_id: generateAllocationId(),
            parking_lot_id: item.parking_lot_id,
            parking_lot_name: `PN${item.parking_lot_id}`,
          };
        } else {
          transformed.assembly[`PN${item.parking_lot_id}`].buses =
            item.capacity;
        }
      });

      data.runtime.busses.forEach((item) => {
        if (!transformed.runtime[`PN${item.parking_lot_id}`]) {
          transformed.runtime[`PN${item.parking_lot_id}`] = {
            cars: 0,
            buses: item.capacity,
            trucks: 0,
            allocation_id: generateAllocationId(),
            parking_lot_id: item.parking_lot_id,
            parking_lot_name: `PN${item.parking_lot_id}`,
          };
        } else {
          transformed.runtime[`PN${item.parking_lot_id}`].buses = item.capacity;
        }
      });

      data.disassembly.busses.forEach((item) => {
        if (!transformed.disassembly[`PN${item.parking_lot_id}`]) {
          transformed.disassembly[`PN${item.parking_lot_id}`] = {
            cars: 0,
            buses: item.capacity,
            trucks: 0,
            allocation_id: generateAllocationId(),
            parking_lot_id: item.parking_lot_id,
            parking_lot_name: `PN${item.parking_lot_id}`,
          };
        } else {
          transformed.disassembly[`PN${item.parking_lot_id}`].buses =
            item.capacity;
        }
      });

      data.assembly.trucks.forEach((item) => {
        if (!transformed.assembly[`PN${item.parking_lot_id}`]) {
          transformed.assembly[`PN${item.parking_lot_id}`] = {
            cars: 0,
            buses: 0,
            trucks: item.capacity,
            allocation_id: generateAllocationId(),
            parking_lot_id: item.parking_lot_id,
            parking_lot_name: `PN${item.parking_lot_id}`,
          };
        } else {
          transformed.assembly[`PN${item.parking_lot_id}`].trucks =
            item.capacity;
        }
      });

      data.runtime.trucks.forEach((item) => {
        if (!transformed.runtime[`PN${item.parking_lot_id}`]) {
          transformed.runtime[`PN${item.parking_lot_id}`] = {
            cars: 0,
            buses: 0,
            trucks: item.capacity,
            allocation_id: generateAllocationId(),
            parking_lot_id: item.parking_lot_id,
            parking_lot_name: `PN${item.parking_lot_id}`,
          };
        } else {
          transformed.runtime[`PN${item.parking_lot_id}`].trucks =
            item.capacity;
        }
      });

      data.disassembly.trucks.forEach((item) => {
        if (!transformed.disassembly[`PN${item.parking_lot_id}`]) {
          transformed.disassembly[`PN${item.parking_lot_id}`] = {
            cars: 0,
            buses: 0,
            trucks: item.capacity,
            allocation_id: generateAllocationId(),
            parking_lot_id: item.parking_lot_id,
            parking_lot_name: `PN${item.parking_lot_id}`,
          };
        } else {
          transformed.disassembly[`PN${item.parking_lot_id}`].trucks =
            item.capacity;
        }
      });

      return transformed;
    };

    const generateAllocationId = () => {
      // Generate a unique allocation ID
      return Math.floor(Math.random() * 1000) + 1;
    };

    const transformedData = transformData(eventData);

    sessionStorage.setItem("recommendation", JSON.stringify(transformedData));
  }, [eventData]);
};

export default RecommendationEngine;
