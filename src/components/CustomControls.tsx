import {
  Controls,
  ControlButton,
  Node,
  useStoreApi,
  ControlProps,
} from "reactflow";

import { styled } from "@mui/material";
import LibraryAddSharpIcon from "@mui/icons-material/LibraryAddSharp";
import AccountTreeSharpIcon from "@mui/icons-material/AccountTreeSharp";

import { shallow } from "zustand/shallow";
import useBoundStore from "../store/store";

import { EmptyNodeSlice, NavigationSlice, NodeColor, NodeData } from "../types";

import { useLayoutedElements } from "../utils";
import { useMemo } from "react";

function CustomControls() {
  // Since ReactFlows Controls component already has a few buttons,
  // we need to style them to match out custom buttons. This is done
  // by simply styling all child buttons of the Controls component at once.
  const StyledControls = useMemo(() => {
    return styled(Controls)<ControlProps>(({ theme }) => {
      return {
        "> button": {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          fill: theme.palette.primary.contrastText,
          width: "1.25rem",
          height: "1.25rem",
          borderRadius: "0.5rem",
          marginTop: "0.25rem",
          marginBottom: "0.25rem",
          borderBottom: "none",
          "&:hover": {
            backgroundColor: theme.palette.primary.dark,
            opacity: 1,
          },
          "&:active": {
            backgroundColor: theme.palette.primary.dark,
            opacity: 0.8,
          },
          "&:disabled": {
            backgroundColor: theme.palette.primary.light,
            opacity: 0.8,
          },
          "> svg": {
            maxWidth: "1.25rem",
            maxHeight: "1.25rem",
          },
        },
      };
    });
  }, []);

  const emptyNodeSelector = (state: EmptyNodeSlice & NavigationSlice) => ({
    // EmptyNodeSlice
    emptySetupComplete: state.emptySetupComplete,
    emptyNodes: state.emptyNodes,
    emptyEdges: state.emptyEdges,
    getEmptyNodeId: state.getEmptyNodeId,
    setEmptyNodes: state.setEmptyNodes,
    setEmptyEdges: state.setEmptyEdges,
    // NavigationSlice
    page: state.page,
  });
  const {
    // EmptyNodeSlice
    emptySetupComplete,
    emptyNodes,
    emptyEdges,
    getEmptyNodeId,
    setEmptyNodes,
    setEmptyEdges,
    // NavigationSlice
    page,
  } = useBoundStore(emptyNodeSelector, shallow);

  const store = useStoreApi();

  const { layoutElements } = useLayoutedElements(
    emptyNodes,
    emptyEdges,
    setEmptyNodes,
    setEmptyEdges,
  );

  const addEmptyNode = () => {
    // Add the node in the center of the viewport.
    // calculation of center copied from: https://stackoverflow.com/a/76394786

    // Get the basic info about the viewport
    const {
      height,
      width,
      transform: [transformX, transformY, zoomLevel],
    } = store.getState();
    const zoomMultiplier = 1 / zoomLevel;

    // Figure out the center of the current viewport
    const centerX = -transformX * zoomMultiplier + (width * zoomMultiplier) / 2;
    const centerY =
      -transformY * zoomMultiplier + (height * zoomMultiplier) / 2;

    const nodeWidth = 70;
    const nodeHeighth = 60;

    // Add offsets for the height/width of the new node
    // (Assuming that you don't have to calculate this as well
    const nodeWidthOffset = nodeWidth / 2;
    const nodeHeightOffset = nodeHeighth / 2;

    const randomXOffset = Math.round(
      (Math.random() * 100 - 50) * zoomMultiplier,
    );
    const randomYOffset = Math.round(
      (Math.random() * 100 - 50) * zoomMultiplier,
    );

    const center: { x: number; y: number } = {
      x: centerX - nodeWidthOffset + randomXOffset,
      y: centerY - nodeHeightOffset + randomYOffset,
    };

    const newNode: Node<NodeData> = {
      id: getEmptyNodeId(),
      type: "empty",
      data: {
        name: "S'",
        empty: false,
        color: NodeColor.none,
      },
      position: center,
    };
    setEmptyNodes([...emptyNodes, newNode]);
  };

  return (
    <StyledControls className="shadow-none">
      <ControlButton
        onClick={() => {
          layoutElements({
            // "elk.algorithm": "layered",
            // "elk.algorithm": "stress",
            // "elk.algorithm": "force",
            // "elk.edgeRouting": "SPLINES",
            // "elk.edgeRouting": "POLYLINE",
            // "elk.edgeRouting": "ORTHOGONAL",
            // "elk.direction": "RIGHT",
            // "elk.nodeLabels.placement": "[INSIDE, H_LEFT, V_TOP]",
          });
        }}
        title="apply layout"
      >
        <AccountTreeSharpIcon />
      </ControlButton>
      {page === 3 && (
        <ControlButton
          onClick={() => {
            addEmptyNode();
          }}
          title="add node"
          disabled={emptySetupComplete}
        >
          <LibraryAddSharpIcon />
        </ControlButton>
      )}
    </StyledControls>
  );
}

export default CustomControls;
