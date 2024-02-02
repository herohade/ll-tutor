// copied and modified from: https://reactflow.dev/
import {
  Node,
  Position
} from "reactflow";

import { NodeData } from "../types";

/**
 * Function to get the intersection point of the line between the center of the intersectionNode and the target node
 * 
 * @param intersectionNode - the node to get the intersection point from
 * @param targetNode - the node where the line is coming from
 * 
 * @returns the intersection point on the intersectionNode
 */
function getNodeIntersection(
  intersectionNode: Node<NodeData>,
  targetNode: Node<NodeData>
) {
  // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
  const {
    width: intersectionNodeWidth, height: intersectionNodeHeight, positionAbsolute: intersectionNodePosition,
  } = intersectionNode;
  const targetPosition = targetNode.positionAbsolute;

  if (!intersectionNodeWidth ||
    !intersectionNodeHeight ||
    !intersectionNodePosition ||
    !targetPosition ||
    !targetNode.width ||
    !targetNode.height) {
    return { x: 0, y: 0 };
  }

  const w = intersectionNodeWidth / 2;
  const h = intersectionNodeHeight / 2;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + targetNode.width / 2;
  const y1 = targetPosition.y + targetNode.height / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x, y };
}

/**
 * Function to get the position (top, bottom, left, right) of the
 * intersection point on the node
 * 
 * @param node - the node to get the position from
 * @param intersectionPoint - the intersection point on the node
 * 
 * @returns the position of the intersection point on the node
 * (top, bottom, left, right)
 */
function getEdgePosition(
  node: Node<NodeData>,
  intersectionPoint: { x: number; y: number; }
) {
  const n = { ...node.positionAbsolute, ...node };
  if (!n.x || !n.y || !n.width || !n.height) {
    return Position.Top;
  }

  const nx = Math.round(n.x);
  const ny = Math.round(n.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  if (px <= nx + 1) {
    return Position.Left;
  }
  if (px >= nx + n.width - 1) {
    return Position.Right;
  }
  if (py <= ny + 1) {
    return Position.Top;
  }
  if (py >= n.y + n.height - 1) {
    return Position.Bottom;
  }

  return Position.Top;
}

// returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) you need to create an edge
/**
 * Function to get the parameters you need to create an edge between the
 * given source and target node
 * 
 * @remarks
 * 
 * This function is used to get the parameters you need to create an edge
 * between two nodes. These are the sources intersection point
 * (sx, sy), the targets intersection point (tx, ty) and the position
 * of the intersection points (top, bottom, left, right).
 * 
 * @param source - the source node
 * @param target - the target node
 * 
 * @returns the parameters you need to create an edge
 */
function getEdgeParams(source: Node<NodeData>, target: Node<NodeData>) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}

export { getEdgeParams };
