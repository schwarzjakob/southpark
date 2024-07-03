import PropTypes from "prop-types";

const getContrastingTextColor = (backgroundColor) => {
  const hex = backgroundColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "black" : "white";
};

const HallEntranceIcons = ({ color, ids }) => {
  const paths = [
    {
      id: "A1",
      d: "M143 376L143 448L180 448L180 376z",
      centerX: 161,
      centerY: 412,
    },
    {
      id: "A2",
      d: "M192 376L192 448L229 448L229 376z",
      centerX: 210,
      centerY: 412,
    },
    {
      id: "A3",
      d: "M240 376L240 448L277 448L277 376z",
      centerX: 259,
      centerY: 412,
    },
    {
      id: "A4",
      d: "M293 376L293 448L330 448L330 376z",
      centerX: 313,
      centerY: 412,
    },
    {
      id: "A5",
      d: "M342 376L342 448L379 448L379 376z",
      centerX: 360,
      centerY: 412,
    },
    {
      id: "A6",
      d: "M391 376L391 448L428 448L428 376z",
      centerX: 409,
      centerY: 412,
    },
    {
      id: "B1",
      d: "M142 278L142 349L179 349L179 278z",
      centerX: 160,
      centerY: 313,
    },
    {
      id: "B2",
      d: "M191 278L191 349L228 349L228 278z",
      centerX: 209,
      centerY: 313,
    },
    {
      id: "B3",
      d: "M239 278L239 349L276 349L276 278z",
      centerX: 258,
      centerY: 313,
    },
    {
      id: "B4",
      d: "M292 278L292 349L329 349L329 278z",
      centerX: 310,
      centerY: 313,
    },
    {
      id: "B5",
      d: "M341 278L341 349L378 349L378 278z",
      centerX: 359,
      centerY: 313,
    },
    {
      id: "B6",
      d: "M390 278L390 348L427 348L427 278z",
      centerX: 408,
      centerY: 313,
    },
    {
      id: "C1",
      d: "M141 207L141 273L178 273L178 207z",
      centerX: 159,
      centerY: 240,
    },
    {
      id: "C2",
      d: "M190 207L190 273L227 273L227 207z",
      centerX: 208,
      centerY: 240,
    },
    {
      id: "C3",
      d: "M239 207L239 273L276 273L276 207z",
      centerX: 257,
      centerY: 240,
    },
    {
      id: "C4",
      d: "M292 207L292 273L329 273L329 207z",
      centerX: 310,
      centerY: 240,
    },
    {
      id: "C5",
      d: "M340 207L340 273L377 273L377 207z",
      centerX: 358,
      centerY: 240,
    },
    {
      id: "C6",
      d: "M389 207L389 273L426 273L426 207z",
      centerX: 407,
      centerY: 240,
    },
    {
      id: "West",
      d: "M74 354L86 354L82 342L126 342L126 351L139 351L139 376L123 376L123 384L80 384L87 370L74 370z",
      centerX: 108,
      centerY: 366,
    },
    {
      id: "North West",
      d: "M104 213L127 202L132 215L109 226z",
      centerX: 118,
      centerY: 188,
    },
    {
      id: "North",
      d: "M273 161L273 201L293 201L293 161z",
      centerX: 283,
      centerY: 181,
    },
    {
      id: "North East",
      d: "M393 189L393 202L423 202L423 196L407 189z",
      centerX: 408,
      centerY: 176,
    },
    {
      id: "East",
      d: "M423 352L441 352L441 340L473 340L464 352L475 352L475 372L464 372L473 382L442 382L442 372L423 372z",
      centerX: 453,
      centerY: 362,
    },
  ];

  return (
    <svg overflow="hidden" width="150" height="120" viewBox="76 180 400 240">
      <g>
        {paths.map((path) => (
          <g key={path.id}>
            <path
              className={`halls ${path.id}`}
              stroke={ids.includes(path.id) ? color : "#cccccc"}
              strokeOpacity="1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={ids.includes(path.id) ? color : "#cccccc"}
              fillOpacity="1"
              fillRule="evenodd"
              d={path.d}
            />
            <text
              x={path.centerX}
              y={path.centerY}
              textAnchor="middle"
              fontSize="26px"
              fontWeight="bold"
              fill={
                ids.includes(path.id) &&
                path.id !== "North West" &&
                path.id !== "North East"
                  ? getContrastingTextColor(color)
                  : "#484848"
              }
              dy=".3em"
            >
              {path.id === "North West"
                ? "NW"
                : path.id === "North East"
                ? "NE"
                : path.id === "South West"
                ? "SW"
                : path.id === "South East"
                ? "SE"
                : path.id === "North"
                ? "N"
                : path.id === "South"
                ? "S"
                : path.id === "East"
                ? "E"
                : path.id === "West"
                ? "W"
                : path.id}{" "}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};

HallEntranceIcons.propTypes = {
  color: PropTypes.string,
  ids: PropTypes.arrayOf(PropTypes.string),
};

export default HallEntranceIcons;
