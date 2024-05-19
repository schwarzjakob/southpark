import 'leaflet/dist/leaflet.css';

import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Tooltip,
  Popup,
} from 'react-leaflet';
import dayjs from 'dayjs';
import axios from 'axios';

const halls = [
  {
    id: 'A1',
    name: 'A1',
    coords: [
      [48.1352644, 11.6943111],
      [48.1338789, 11.6943299],
      [48.1338897, 11.6953142],
      [48.1352716, 11.6952928],
    ],
  },
  {
    id: 'A2',
    name: 'A2',
    coords: [
      [48.1352782, 11.6957927],
      [48.1338892, 11.6958115],
      [48.133899, 11.696798],
      [48.1352781, 11.6967803],
    ],
  },
  {
    id: 'A3',
    name: 'A3',
    coords: [
      [48.1352833, 11.6972707],
      [48.1338978, 11.6972868],
      [48.1339031, 11.6982665],
      [48.1352886, 11.6982504],
    ],
  },
  {
    id: 'A4',
    name: 'A4',
    coords: [
      [48.1352981, 11.698881],
      [48.1339126, 11.6988998],
      [48.1339198, 11.6998822],
      [48.1353035, 11.6998661],
    ],
  },
  {
    id: 'A5',
    name: 'A5',
    coords: [
      [48.135309, 11.7003617],
      [48.1339217, 11.7003778],
      [48.1339235, 11.7013626],
      [48.1353126, 11.7013438],
    ],
  },
  {
    id: 'A6',
    name: 'A6',
    coords: [
      [48.135315, 11.7018373],
      [48.1339313, 11.7018587],
      [48.1339367, 11.7028409],
      [48.135324, 11.7028194],
    ],
  },
  {
    id: 'B1',
    name: 'B1',
    coords: [
      [48.1372428, 11.6942775],
      [48.1358609, 11.694291],
      [48.1358645, 11.6952868],
      [48.1372499, 11.6952706],
    ],
  },
  {
    id: 'B2',
    name: 'B2',
    coords: [
      [48.1373246, 11.6957605],
      [48.1358658, 11.6957739],
      [48.135873, 11.6967617],
      [48.13733, 11.6967429],
    ],
  },
  {
    id: 'B3',
    name: 'B3',
    coords: [
      [48.1373359, 11.6972353],
      [48.1358824, 11.6972567],
      [48.135886, 11.6982418],
      [48.1373413, 11.6982176],
    ],
  },
  {
    id: 'B4',
    name: 'B4',
    coords: [
      [48.1373458, 11.6988463],
      [48.1358905, 11.6988651],
      [48.1358941, 11.6998502],
      [48.137344, 11.6998314],
    ],
  },
  {
    id: 'B5',
    name: 'B5',
    coords: [
      [48.1373561, 11.7003262],
      [48.1358955, 11.7003477],
      [48.1359008, 11.7013301],
      [48.1373615, 11.701314],
    ],
  },
  {
    id: 'B6',
    name: 'B6',
    coords: [
      [48.1373666, 11.7018049],
      [48.1359042, 11.7018236],
      [48.1359113, 11.7028007],
      [48.1373702, 11.7027819],
    ],
  },
  {
    id: 'C1',
    name: 'C1',
    coords: [
      [48.1386835, 11.6942591],
      [48.1374234, 11.6942725],
      [48.1374288, 11.6952603],
      [48.1386889, 11.6952415],
    ],
  },
  {
    id: 'C2',
    name: 'C2',
    coords: [
      [48.1386945, 11.695738],
      [48.1374039, 11.6957541],
      [48.1374093, 11.6967472],
      [48.1387034, 11.6967258],
    ],
  },
  {
    id: 'C3',
    name: 'C3',
    coords: [
      [48.138707, 11.6972158],
      [48.1374147, 11.6972319],
      [48.1374218, 11.698217],
      [48.1387124, 11.6982009],
    ],
  },
  {
    id: 'C4',
    name: 'C4',
    coords: [
      [48.1387157, 11.6988308],
      [48.1374467, 11.6988442],
      [48.1374502, 11.6998213],
      [48.1387211, 11.6998078],
    ],
  },
  {
    id: 'C5',
    name: 'C5',
    coords: [
      [48.1387257, 11.7002968],
      [48.1374334, 11.7003102],
      [48.1374387, 11.7013007],
      [48.1387311, 11.7012873],
    ],
  },
  {
    id: 'C6',
    name: 'C6',
    coords: [
      [48.1387363, 11.7017778],
      [48.1374422, 11.7017993],
      [48.1374493, 11.702779],
      [48.1387399, 11.7027629],
    ],
  },
];

const parkingLots = [
  {
    id: 'P1 Nord (Tor 17a - Tor 11c)',
    name: 'P1 Nord (Tor 17a - Tor 11c)',
    coords: [
      [48.1417206, 11.700205],
      [48.1417708, 11.7006773],
      [48.1417922, 11.7062698],
      [48.1384277, 11.709568],
      [48.1384032, 11.7090745],
      [48.1384095, 11.7085468],
      [48.1384921, 11.7070991],
      [48.1388762, 11.7050723],
      [48.1394444, 11.702988],
      [48.1400732, 11.7002774],
    ],
  },
  {
    id: 'P1 Nord (westl. Tor 17a)',
    name: 'P1 Nord (westl. Tor 17a)',
    coords: [
      [48.1412926, 11.6975452],
      [48.1404584, 11.6981824],
      [48.1401018, 11.7001409],
      [48.1416906, 11.7000933],
      [48.141649, 11.6976807],
    ],
  },
  {
    id: 'P2 Nord (östl. Tor 11c)',
    name: 'P2 Nord (östl. Tor 11c)',
    coords: [
      [48.1408516, 11.7073096],
      [48.1385636, 11.7094934],
      [48.1384627, 11.7096188],
      [48.1384099, 11.7096855],
      [48.1385188, 11.7109966],
      [48.1397178, 11.7097633],
      [48.1405108, 11.7088749],
      [48.1405028, 11.7087385],
      [48.140855, 11.7082945],
      [48.1408516, 11.7073096],
    ],
  },
  {
    id: 'P3',
    name: 'P3',
    coords: [
      [48.1390493, 11.6972283],
      [48.1390558, 11.6980711],
      [48.1398488, 11.6980645],
      [48.1399943, 11.6973839],
      [48.1399854, 11.6972524],
      [48.1399353, 11.6971961],
      [48.1390493, 11.6972283],
    ],
  },
  {
    id: 'P4',
    name: 'P4',
    coords: [
      [48.1396359, 11.6989453],
      [48.1394766, 11.6997899],
      [48.1390596, 11.6997872],
      [48.1390578, 11.6989479],
    ],
  },
  {
    id: 'P5',
    name: 'P5',
    coords: [
      [48.1394505, 11.7001903],
      [48.1390535, 11.7001831],
      [48.1390458, 11.7014863],
      [48.1391777, 11.7014832],
    ],
  },
  {
    id: 'P7',
    name: 'P7',
    coords: [
      [48.1385681, 11.7034823],
      [48.1361815, 11.7035074],
      [48.1361882, 11.7043663],
      [48.1359054, 11.7043925],
      [48.1359051, 11.7047203],
      [48.1376266, 11.7046675],
      [48.1379881, 11.7044422],
      [48.1382531, 11.7041741],
      [48.1384786, 11.7037719],
    ],
  },
  {
    id: 'P8',
    name: 'P8',
    coords: [
      [48.1380376, 11.704922],
      [48.1380497, 11.7058797],
      [48.1378568, 11.7058856],
      [48.1378643, 11.7067451],
      [48.1358968, 11.7055821],
      [48.1358932, 11.7050025],
      [48.1380412, 11.704922],
    ],
  },
  {
    id: 'P9 - 12',
    name: 'P9 - P12',
    coords: [
      [48.13781, 11.7071893],
      [48.137823, 11.7109108],
      [48.1336863, 11.7109776],
      [48.1336643, 11.706073],
      [48.1358736, 11.7060593],
    ],
  },
  {
    id: 'Parkhaus West',
    name: 'Parkhaus West',
    coords: [
      [48.1389099, 11.6903538],
      [48.1379863, 11.6912121],
      [48.1387381, 11.6931111],
      [48.1396832, 11.6922742],
    ],
  },
];

// Define an array of colors
const colors = [
  'purple',
  'orange',
  'cyan',
  'pink',
  'teal',
  'indigo',
  'lime',
  'amber',
  'deepOrange',
  'deepPurple',
  'lightBlue',
  'lightGreen',
  'yellow',
];

const MapComponent = ({ selectedDate }) => {
  const [events, setEvents] = useState([]);
  const [eventMapping, setEventMapping] = useState({});
  const [colorMapping, setColorMapping] = useState({});

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:5000/events_map/${selectedDate}`)
      .then((response) => {
        if (response.status === 200) {
          const eventsData = response.data;
          setEvents(eventsData);

          // Create a mapping of event names to colors
          const eventMap = {};
          eventsData.forEach((event) => {
            if (!eventMap[event.event_name]) {
              eventMap[event.event_name] = { halls: [], parkingLots: [] };
            }
            if (event.hall_name) {
              eventMap[event.event_name].halls.push(event.hall_name);
            }
            if (event.parking_lot_name) {
              eventMap[event.event_name].parkingLots.push(
                event.parking_lot_name
              );
            }
          });
          setEventMapping(eventMap);

          // Create a mapping of event names to colors
          const colorMap = {};
          Object.keys(eventMap).forEach((eventName, index) => {
            colorMap[eventName] = colors[index % colors.length];
          });
          setColorMapping(colorMap);
        }
      })
      .catch((error) => {
        console.error('There was an error fetching the events data!', error);
      });
  }, [selectedDate]);

  const getPopupContent = (id) => {
    const event = events.find(
      (event) => event.hall_name === id || event.parking_lot_name === id
    );

    if (event) {
      if (event.hall_name === id) {
        // This is a hall
        return (
          <div className="cap">
            <h4>{event.event_name}</h4>
            <p>Status: {event.status}</p>
            <p>Entrance: {event.event_entrance}</p>
            <p>Allocated Parking Lots: {event.parking_lot_name}</p>
          </div>
        );
      } else {
        // This is a parking lot
        return (
          <div className="cap">
            <h4>{event.event_name}</h4>
            <p>Status: {event.status}</p>
            <p>Entrance: {event.event_entrance}</p>
            <p>Associated Hall: {event.hall_name}</p>
          </div>
        );
      }
    }
    return <span>No Event!</span>;
  };

  const getPolygonColor = (name) => {
    for (const eventName in eventMapping) {
      const { halls, parkingLots } = eventMapping[eventName];
      if (halls.includes(name) || parkingLots.includes(name)) {
        return `${colorMapping[eventName]}`;
      }
    }
    return 'gray';
  };

  return (
    <MapContainer center={[48.1375, 11.702]} zoom={16} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Rendering halls */}
      {halls.map((hall) => {
        const color = getPolygonColor(hall.name);
        return (
          <Polygon
            key={hall.id}
            positions={hall.coords}
            className={`halls hall-${hall.id}`}
            pathOptions={{ color: color, fillColor: color, fillOpacity: 0.9 }}
          >
            <Tooltip
              direction="center"
              offset={[0, 0]}
              permanent
              className="tags"
            >
              <span>{hall.name}</span>
            </Tooltip>
            <Popup>{getPopupContent(hall.name)}</Popup>
          </Polygon>
        );
      })}
      {/* Rendering parking lots */}
      {parkingLots.map((lot) => {
        const color = getPolygonColor(lot.name);
        console.log(lot.name, color);
        return (
          <Polygon
            key={lot.id}
            positions={lot.coords}
            className={`parking-lots parking-${lot.id}`}
            pathOptions={{ color: color, fillColor: color, fillOpacity: 0.9 }}
          >
            <Tooltip direction="center" offset={[0, 0]} permanent>
              <span>{lot.name}</span>
            </Tooltip>
            <Popup>{getPopupContent(lot.name)}</Popup>
          </Polygon>
        );
      })}
    </MapContainer>
  );
};
export default MapComponent;
