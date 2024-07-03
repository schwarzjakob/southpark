import PropTypes from "prop-types";

const HallEntranceIcons = ({ color, ids }) => {
  const paths = [
    { id: "A1", d: "M145 378L145 446L178 446L177 378z" },
    { id: "A2", d: "M194 378L194 446L227 446L226 378z" },
    { id: "A3", d: "M242 378L243 446L275 446L275 378z" },
    { id: "A4", d: "M566 549L567 617L599 617L599 549z" }, // Added missing path
    { id: "A5", d: "M344 378L345 446L377 446L377 378z" },
    { id: "A6", d: "M393 378L394 446L426 446L425 378z" },
    { id: "B1", d: "M144 280L144 347L177 347L176 280z" },
    { id: "B2", d: "M193 280L193 347L226 347L225 280z" },
    { id: "B3", d: "M241 280L242 347L274 347L274 280z" },
    { id: "B4", d: "M294 280L294 347L327 347L327 280z" },
    { id: "B5", d: "M343 280L344 347L376 347L376 280z" },
    { id: "B6", d: "M392 280L392 346L425 346L424 280z" },
    { id: "C1", d: "M143 209L144 271L176 271L175 209z" },
    { id: "C2", d: "M192 209L192 271L225 271L224 209z" },
    { id: "C3", d: "M241 209L241 271L274 271L273 209z" },
    { id: "C4", d: "M294 209L294 271L326 271L326 209z" },
    { id: "C5", d: "M342 209L343 271L375 271L375 209z" },
    { id: "C6", d: "M391 209L392 271L424 271L423 209z" },
    {
      id: "West",
      d: "M80 358L88 358L84 346L128 346L128 351L141 351L141 376L129 376L129 384L86 384L89 374L80 374z",
    },
    { id: "North West", d: "M106 215L125 204L130 213L111 224z" },
    { id: "North", d: "M275 163L275 199L291 199L291 163z" },
    {
      id: "North East",
      d: "M393 193L393 206L423 206L423 200L407 193z",
    },
    {
      id: "East",
      d: "M425 354L439 354L439 342L471 342L466 354L473 354L473 370L466 370L471 380L440 380L440 370L425 370z",
    },
    { id: "parking-lot-PN3", d: "M255 62L287 62L287 135L276 129L252 80z" },
    { id: "parking-lot-PN4", d: "M290 62L338 62L338 149L290 136z" },
    { id: "parking-lot-PN5", d: "M341 152L341 59L354 56L379 56L379 163z" },
    { id: "parking-lot-PN6", d: "M382 56L382 164L430 181L430 56z" },
    { id: "parking-lot-PN7", d: "M433 56L433 181L501 209L501 56z" },
    { id: "parking-lot-PN8", d: "M504 56L504 211L527 218L527 56z" },
    { id: "parking-lot-PN9", d: "M530 56L530 219L561 227L561 82L539 56z" },
    { id: "parking-lot-PN10", d: "M564 86L564 227L588 231L613 233L613 169z" },
    { id: "parking-lot-PN11", d: "M615 172L615 233L651 233z" },
    { id: "parking-lot-PN12", d: "M586 119L654 232L677 230L700 225L625 119z" },
  ];

  return (
    <svg width="200" height="90" viewBox="0 100 800 400">
      <g>
        {paths.map((path) => (
          <path
            key={path.id}
            className={`halls ${path.id}`}
            stroke="#b3b3b3"
            strokeOpacity="1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={ids.includes(path.id) ? color : "#cccccc"}
            fillOpacity="1"
            fillRule="evenodd"
            d={path.d}
          />
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
