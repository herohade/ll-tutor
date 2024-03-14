import {
  ConnectionLineComponentProps,
  Position,
  getStraightPath,
} from "reactflow";
import { NodeColor } from "../types";

// this import is only required for a tsdoc @link tag:
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { FloatingEdge } from "../components";

/**
 * The props for the {@link ConnectionLine} component4
 * It is the default ReactFlow {@link ConnectionLineComponentProps}.
 */
export type Props = ConnectionLineComponentProps;

// This is a disgusting hack to get the arrowheads to work.
// Reactflow dynamically generates the arrowheads for edges.
// Since it does not support MarkerTypes for ConnectionLines (only Edges)
// and we can not guarantee that the arrowhead definition exists
// we provide a copy/paste of the arrowhead definition here.
const markerDef = (
  <defs>
    <marker
      className="react-flow__arrowhead"
      id="custom__1__color=none&amp;orient=auto&amp;type=arrowclosed"
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
      id="custom__1__color=new&amp;orient=auto&amp;type=arrowclosed"
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

/**
 * This is the line that users see when connecting nodes.
 * Once the user releases the mouse, this is replaced by a
 * {@link FloatingEdge}.
 * 
 * @param props - default ReactFlow {@link ConnectionLineComponentProps}.
 */
function ConnectionLine(props: Props) {
  const { fromX, fromY, toX, toY, fromNode, fromPosition } = props;

  // This ReactFlow function returns the path of the line between the two nodes.
  // it also returns lable position and difference between source and middle of
  // the path, but we don't need those.
  const [edgePath] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  // We use the arrowhead marker to indicate the direction of the edge.
  // This is pretty much a copy paste of the string that proper Edges
  // (from ReactFlow) use.
  const marker =
    "url(#custom__1__color=" +
    ((fromPosition === Position.Bottom && fromNode?.data.empty) ? "new" : "none") +
    "&orient=auto&type=arrowclosed)";
  return (
    <g>
      {markerDef}
      <path
        fill="none"
        stroke={(fromPosition === Position.Bottom && fromNode?.data.empty) ? NodeColor.thisTurn : NodeColor.none}
        strokeWidth={2}
        className="animated"
        // For now the source is always the bottom, this would need to be
        // changed if that is no longer the case
        // This does not describe the actual placement - both source and target
        // are stacked on top of each other - but the Node variable "position"
        markerEnd={fromPosition === Position.Bottom ? marker : undefined}
        markerStart={fromPosition === Position.Bottom ? undefined : marker}
        d={edgePath}
      />
    </g>
  );
}

export default ConnectionLine;
