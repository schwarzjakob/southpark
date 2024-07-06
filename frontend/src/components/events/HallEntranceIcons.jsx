import PropTypes from "prop-types";

const getContrastingTextColor = (backgroundColor) => {
  const hex = backgroundColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "black" : "white";
};

const HallEntranceIcons = ({ color, hallIds = [], entranceIds = [] }) => {
  const hallPaths = [
    {
      id: 1,
      name: "A1",
      type: "hall",
      d: "M143 376L143 448L180 448L180 376z",
      centerX: 161,
      centerY: 412,
    },
    {
      id: 2,
      name: "A2",
      type: "hall",
      d: "M192 376L192 448L229 448L229 376z",
      centerX: 210,
      centerY: 412,
    },
    {
      id: 3,
      name: "A3",
      type: "hall",
      d: "M240 376L240 448L277 448L277 376z",
      centerX: 259,
      centerY: 412,
    },
    {
      id: 4,
      name: "A4",
      type: "hall",
      d: "M293 376L293 448L330 448L330 376z",
      centerX: 313,
      centerY: 412,
    },
    {
      id: 5,
      name: "A5",
      type: "hall",
      d: "M342 376L342 448L379 448L379 376z",
      centerX: 360,
      centerY: 412,
    },
    {
      id: 6,
      name: "A6",
      type: "hall",
      d: "M391 376L391 448L428 448L428 376z",
      centerX: 409,
      centerY: 412,
    },
    {
      id: 7,
      name: "B1",
      type: "hall",
      d: "M142 278L142 349L179 349L179 278z",
      centerX: 160,
      centerY: 313,
    },
    {
      id: 8,
      name: "B2",
      type: "hall",
      d: "M191 278L191 349L228 349L228 278z",
      centerX: 209,
      centerY: 313,
    },
    {
      id: 9,
      name: "B3",
      type: "hall",
      d: "M239 278L239 349L276 349L276 278z",
      centerX: 258,
      centerY: 313,
    },
    {
      id: 10,
      name: "B4",
      type: "hall",
      d: "M292 278L292 349L329 349L329 278z",
      centerX: 310,
      centerY: 313,
    },
    {
      id: 11,
      name: "B5",
      type: "hall",
      d: "M341 278L341 349L378 349L378 278z",
      centerX: 359,
      centerY: 313,
    },
    {
      id: 12,
      name: "B6",
      type: "hall",
      d: "M390 278L390 348L427 348L427 278z",
      centerX: 408,
      centerY: 313,
    },
    {
      id: 13,
      name: "C1",
      type: "hall",
      d: "M141 207L141 273L178 273L178 207z",
      centerX: 159,
      centerY: 240,
    },
    {
      id: 14,
      name: "C2",
      type: "hall",
      d: "M190 207L190 273L227 273L227 207z",
      centerX: 208,
      centerY: 240,
    },
    {
      id: 15,
      name: "C3",
      type: "hall",
      d: "M239 207L239 273L276 273L276 207z",
      centerX: 257,
      centerY: 240,
    },
    {
      id: 16,
      name: "C4",
      type: "hall",
      d: "M292 207L292 273L329 273L329 207z",
      centerX: 310,
      centerY: 240,
    },
    {
      id: 17,
      name: "C5",
      type: "hall",
      d: "M340 207L340 273L377 273L377 207z",
      centerX: 358,
      centerY: 240,
    },
    {
      id: 18,
      name: "C6",
      type: "hall",
      d: "M389 207L389 273L426 273L426 207z",
      centerX: 407,
      centerY: 240,
    },
  ];

  const entrancePaths = [
    {
      id: 1,
      name: "W",
      type: "entrance",
      d: "M74 354L86 354L82 342L126 342L126 351L139 351L139 376L123 376L123 384L80 384L87 370L74 370z",
      centerX: 108,
      centerY: 366,
    },
    {
      id: 2,
      name: "NW",
      type: "entrance",
      d: "M104 213L127 202L132 215L109 226z",
      centerX: 118,
      centerY: 188,
    },
    {
      id: 3,
      name: "North",
      type: "entrance",
      d: "M273 161L273 201L293 201L293 161z",
      centerX: 283,
      centerY: 181,
    },
    {
      id: 4,
      name: "N",
      type: "entrance",
      d: "M393 189L393 202L423 202L423 196L407 189z",
      centerX: 408,
      centerY: 176,
    },
    {
      id: 5,
      name: "E",
      type: "entrance",
      d: "M423 352L441 352L441 340L473 340L464 352L475 352L475 372L464 372L473 382L442 382L442 372L423 372z",
      centerX: 453,
      centerY: 362,
    },
  ];

  return (
    <svg overflow="hidden" width="150" height="120" viewBox="76 180 400 240">
      <g>
        {hallPaths.map((path) => (
          <g key={path.id}>
            <path
              className={`halls ${path.name}`}
              stroke={hallIds.includes(path.id) ? color : "#cccccc"}
              strokeOpacity="1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={hallIds.includes(path.id) ? color : "#cccccc"}
              fillOpacity="1"
              fillRule="evenodd"
              d={path.d}
            />
            <text
              x={path.centerX}
              y={path.centerY}
              textAnchor="middle"
              fontSize="26px"
              fontWeight="semi-bold"
              fill={
                hallIds.includes(path.id)
                  ? getContrastingTextColor(color)
                  : "#484848"
              }
              dy=".3em"
            >
              {path.name}
            </text>
          </g>
        ))}
        {entrancePaths.map((path) => (
          <g key={path.id}>
            <path
              className={`entrances ${path.name}`}
              stroke={entranceIds.includes(path.id) ? color : "#cccccc"}
              strokeOpacity="1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={entranceIds.includes(path.id) ? color : "#cccccc"}
              fillOpacity="1"
              fillRule="evenodd"
              d={path.d}
            />
            <text
              x={path.centerX}
              y={path.centerY}
              textAnchor="middle"
              fontSize="26px"
              fontWeight="semi-bold"
              fill={
                entranceIds.includes(path.id)
                  ? getContrastingTextColor(color)
                  : "#484848"
              }
              dy=".3em"
            >
              {path.name}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};

HallEntranceIcons.propTypes = {
  color: PropTypes.string,
  hallIds: PropTypes.arrayOf(PropTypes.number),
  entranceIds: PropTypes.arrayOf(PropTypes.number),
};

export default HallEntranceIcons;
HallEntranceIcons;
