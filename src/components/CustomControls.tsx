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

import {
  EmptyNodeSlice,
  FirstNodeSlice,
  FollowNodeSlice,
  NavigationSlice,
  NodeColor,
  NodeData,
} from "../types";

import { useLayoutedElements } from "../utils";
import { useMemo } from "react";

/**
 * Tomponent that provides custom buttons for the ReactFlow
 * graph canvas.
 * 
 * @remarks
 * 
 * The custom buttons are the layout-button and the add-node-button.
 * 
 */
function CustomControls() {
  // Since ReactFlow's Controls component already has a few buttons,
  // we need to style them to match our custom buttons. This is done
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

  const emptyNodeSelector = (
    state: EmptyNodeSlice & FirstNodeSlice & FollowNodeSlice & NavigationSlice,
  ) => ({
    // EmptyNodeSlice
    emptySetupComplete: state.emptySetupComplete,
    emptyNodes: state.emptyNodes,
    emptyEdges: state.emptyEdges,
    getEmptyNodeId: state.getEmptyNodeId,
    setEmptyNodes: state.setEmptyNodes,
    setEmptyEdges: state.setEmptyEdges,
    // FirstNodeSlice
    firstSetupComplete: state.firstSetupComplete,
    firstNodes: state.firstNodes,
    firstEdges: state.firstEdges,
    getFirstNodeId: state.getFirstNodeId,
    setFirstNodes: state.setFirstNodes,
    setFirstEdges: state.setFirstEdges,
    // FollowNodeSlice
    followSetupComplete: state.followSetupComplete,
    followNodes: state.followNodes,
    followEdges: state.followEdges,
    getFollowNodeId: state.getFollowNodeId,
    setFollowNodes: state.setFollowNodes,
    setFollowEdges: state.setFollowEdges,
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
    // FirstNodeSlice
    firstSetupComplete,
    firstNodes,
    firstEdges,
    getFirstNodeId,
    setFirstNodes,
    setFirstEdges,
    // FollowNodeSlice
    followSetupComplete,
    followNodes,
    followEdges,
    getFollowNodeId,
    setFollowNodes,
    setFollowEdges,
    // NavigationSlice
    page,
  } = useBoundStore(emptyNodeSelector, shallow);

  // with this we can directly access ReactFlow's internal state
  const store = useStoreApi();

  const { layoutElements } = useLayoutedElements(
    emptyNodes,
    emptyEdges,
    setEmptyNodes,
    setEmptyEdges,
    firstNodes,
    firstEdges,
    setFirstNodes,
    setFirstEdges,
    followNodes,
    followEdges,
    setFollowNodes,
    setFollowEdges,
  );

  /**
   * Adds a new EmptyNode to the empty-graph.
   */
  const addEmptyNode = () => {
    // Add the node in the center of the viewport.
    // computation of center copied and modified from: https://stackoverflow.com/a/76394786

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
    // (Assuming that you don't have to compute this as well
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

  /**
   * Adds a new FirstGroupNode to the first-graph.
   */
  const addFirstGroupNode = () => {
    // Add the node in the center of the viewport.
    // computation of center copied and modified from: https://stackoverflow.com/a/76394786

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
    // (Assuming that you don't have to compute this as well
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
      id: getFirstNodeId(),
      type: "group",
      deletable: false,
      data: {
        name: "SCC()",
        empty: false,
        color: NodeColor.none,
      },
      position: center,
    };
    setFirstNodes([...firstNodes, newNode]);
  };

  /**
   * Adds a new FollowGroupNode to the follow-graph.
   */
  const addFollowGroupNode = () => {
    // Add the node in the center of the viewport.
    // computation of center copied and modified from: https://stackoverflow.com/a/76394786

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
    // (Assuming that you don't have to compute this as well
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
      id: getFollowNodeId(),
      type: "group",
      deletable: false,
      data: {
        name: "Follow(SCC())",
        empty: false,
        color: NodeColor.none,
      },
      position: center,
    };
    setFollowNodes([...followNodes, newNode]);
  };

  return (
    <StyledControls className="shadow-none">
      <ControlButton
        onClick={() => {
          const whichNodes = page < 5 ? "empty" : page < 7 ? "first" : "follow";
          layoutElements(whichNodes, {
            // custom layouting options would go here
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
      {page === 5 && (
        <ControlButton
          onClick={() => {
            addFirstGroupNode();
          }}
          title="add node"
          disabled={firstSetupComplete}
        >
          <LibraryAddSharpIcon />
        </ControlButton>
      )}
      {page === 7 && (
        <ControlButton
          onClick={() => {
            addFollowGroupNode();
          }}
          title="add node"
          disabled={followSetupComplete}
        >
          <LibraryAddSharpIcon />
        </ControlButton>
      )}
    </StyledControls>
  );
}

export default CustomControls;
