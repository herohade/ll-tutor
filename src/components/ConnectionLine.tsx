import {
  ConnectionLineComponentProps,
  Position,
  getStraightPath,
} from "reactflow";
import { NodeColor } from "../types";

type Props = ConnectionLineComponentProps;

// This is a disgusting hack to get the arrowheads to work.
// Reactflow dynamically generates the arrowheads for edges.
// Since it does not support MarkerTypes for ConnectionLines
// and we can not guarantee that the arrowhead definition exists
// we provide a copy/paste of the arrowhead definition here.
const markerDef = (
  <defs>
    <marker
      className="react-flow__arrowhead"
      id="custom__1__color=grey&amp;orient=auto&amp;type=arrowclosed"
      markerWidth="12.5"
      markerHeight="12.5"
      viewBox="-10 -10 20 20"
      markerUnits="strokeWidth"
      orient="auto"
      refX="0"
      refY="0"
    >
      <polyline
        style={{
          stroke: "grey",
          fill: "grey",
          strokeWidth: "1px",
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        points="-5,-4 0,0 -5,4 -5,-4"
      ></polyline>
    </marker>
    <marker
      className="react-flow__arrowhead"
      id="custom__1__color=lightblue&amp;orient=auto&amp;type=arrowclosed"
      markerWidth="12.5"
      markerHeight="12.5"
      viewBox="-10 -10 20 20"
      markerUnits="strokeWidth"
      orient="auto"
      refX="0"
      refY="0"
    >
      <polyline
        style={{
          stroke: "lightblue",
          fill: "lightblue",
          strokeWidth: "1px",
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        points="-5,-4 0,0 -5,4 -5,-4"
      ></polyline>
    </marker>
  </defs>
);

function ConnectionLine(props: Props) {
  const { fromX, fromY, toX, toY, fromNode, fromPosition } = props;

  const [edgePath] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  const marker =
    "url(#custom__1__color=" +
    ((fromPosition === Position.Bottom && fromNode?.data.empty) ? NodeColor.thisTurn : NodeColor.none) +
    "&orient=auto&type=arrowclosed)";
  return (
    <g>
      {markerDef}
      <path
        fill="none"
        stroke={(fromPosition === Position.Bottom && fromNode?.data.empty) ? NodeColor.thisTurn : NodeColor.none}
        strokeWidth={2}
        className="animated"
        // for now the source is always the bottom, this would need to be
        // changed if the source is not always the bottom
        markerEnd={fromPosition === Position.Bottom ? marker : undefined}
        markerStart={fromPosition === Position.Bottom ? undefined : marker}
        d={edgePath}
      />
    </g>
  );
}

export default ConnectionLine;
