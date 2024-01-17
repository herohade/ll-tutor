// copied and modified from: https://reactflow.dev/docs/examples/edges/floating-edges/
import { useCallback } from "react";
import {
  useStore,
  getBezierPath,
  Node,
  Position,
  EdgeProps,
  getStraightPath,
  getSmoothStepPath,
  BaseEdge,
} from "reactflow";

import { EdgeData, EdgePathType, NodeData } from "../types";

import { getEdgeParams } from "../utils";

type Props = EdgeProps<EdgeData>;

function FloatingEdge(props: Props) {
  const {
    id,
    source,
    sourceX,
    sourceY,
    sourcePosition,
    target,
    targetX,
    targetY,
    targetPosition,
    markerEnd,
    style,
    data,
  } = props;
  const interactionWidth = props.interactionWidth || 20;

  const sourceNode: Node<NodeData> | undefined = useStore(
    useCallback((store) => store.nodeInternals.get(source), [source])
  );
  const targetNode: Node<NodeData> | undefined = useStore(
    useCallback((store) => store.nodeInternals.get(target), [target])
  );

  if (!sourceNode || !targetNode) {
    return null;
  }

  // special edges copied and modified from: https://reactflow.dev/docs/examples/edges/custom-edge/
  // TODO: maybe add bidirectional edges, e.g. by giving nodes a
  // bidirectional array and checking here if the edge is in the array

  // This returns a special self-loop edge if source and target are the same
  // TODO: make self-loop for group-Nodes start and end at the outer div instead of content-div (label)
  if (sourceNode.id === targetNode.id) {
    if (
      (sourcePosition === Position.Top && targetPosition === Position.Bottom) ||
      (sourcePosition === Position.Bottom && targetPosition === Position.Top)
    ) {
      // if source and target are on the top and bottom side of the node
      const radiusX =
        (sourceNode.type === "group"
          ? sourceNode.data.labelSize?.width || 100
          : sourceNode.width || 100) * 0.6;
      const radiusY = (sourceY - targetY) * 0.6;
      const edgePath = `M ${sourceX} ${
        sourceY + 5
      } A ${radiusX} ${radiusY} 0 1 1 ${targetX} ${targetY - 2}`;

      return (
        <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      );
    } else {
      if (
        (sourcePosition === Position.Left &&
          targetPosition === Position.Right) ||
        (sourcePosition === Position.Right && targetPosition === Position.Left)
      ) {
        // if source and target are on the left and right side of the node
        const radiusX = (sourceX - targetX) * 0.6;
        const radiusY = 50;
        const edgePath = `M ${
          sourceX - 5
        } ${sourceY} A ${radiusX} ${radiusY} 0 1 0 ${targetX + 2} ${targetY}`;

        return (
          <BaseEdge
            id={id}
            path={edgePath}
            markerEnd={markerEnd}
            style={style}
          />
        );
      } else {
        // TODO: implement other cases. These are currently not required.
        throw new Error("Error Code 159fc0: Please contact the developer!");
      }
    }
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode
  );

  const [edgePath] = (function () {
    switch (data?.pathType) {
      case EdgePathType.Bezier:
        return getBezierPath({
          sourceX: sx,
          sourceY: sy,
          sourcePosition: sourcePos,
          targetPosition: targetPos,
          targetX: tx,
          targetY: ty,
        });
      case EdgePathType.Smoothstep:
        return getSmoothStepPath({
          sourceX: sx,
          sourceY: sy,
          sourcePosition: sourcePos,
          targetPosition: targetPos,
          targetX: tx,
          targetY: ty,
        });
      case EdgePathType.Straight:
      default:
        return getStraightPath({
          sourceX: sx,
          sourceY: sy,
          targetX: tx,
          targetY: ty,
        });
    }
  })();

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={style}
      />
      {interactionWidth > 0 && (
        <path
          id={id}
          className="react-flow__edge-interaction"
          d={edgePath}
          fill="none"
          strokeOpacity="0"
          strokeWidth={interactionWidth}
        />
      )}
    </>
  );
}

export default FloatingEdge;
