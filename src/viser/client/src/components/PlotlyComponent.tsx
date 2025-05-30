import React from "react";
import { GuiPlotlyMessage, GuiPlotlyUpdateMessage } from "../WebsocketMessages";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Box, Paper, Tooltip } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";

// When drawing border around the plot, it should be aligned with the folder's.
import { folderWrapper } from "./Folder.css";


// Add this function to PlotlyComponent.tsx
function printAllUUIDs() {
  // Get all elements in the document
  const allElements = document.getElementsByTagName('*');
  const uuids: string[] = [];
  
  // Loop through all elements and collect their IDs
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    if (element.id) {
      uuids.push(element.id);
    }
  }
  
  console.log("All UUIDs in the scene:", uuids);
  return uuids;
}



const PlotWithAspect = React.memo(function PlotWithAspect({
  jsonStr,
  aspectRatio,
  staticPlot,
  uuid, // Add this prop to receive the UUID
  isModal = false, // Add this prop to identify if this is the modal plot
}: {
  jsonStr: string;
  aspectRatio: number;
  staticPlot: boolean;
  uuid: string;
  isModal?: boolean;
}) {
  // Catch if the jsonStr is empty; if so, render an empty div.
  if (jsonStr === "") return <div></div>;

  // Parse json string, to construct plotly object.
  // Note that only the JSON string is kept as state, not the json object.
  const plotJson = JSON.parse(jsonStr);

  // This keeps the zoom-in state, etc, see https://plotly.com/javascript/uirevision/.
  plotJson.layout.uirevision = "true";

  // Box size change -> width value change -> plot rerender trigger.
  const { ref, width } = useElementSize();
  plotJson.layout.width = width;
  plotJson.layout.height = width * aspectRatio;

  // Make the plot non-interactable, if specified.
  // Ideally, we would use `staticplot`, but this has a known bug with 3D plots:
  // - https://github.com/plotly/plotly.js/issues/457
  // In the meantime, we choose to disable all interactions.
  if (staticPlot) {
    if (plotJson.config === undefined) plotJson.config = {};
    plotJson.config.displayModeBar = false;
    plotJson.layout.dragmode = false;
    plotJson.layout.hovermode = false;
    plotJson.layout.clickmode = "none";
  }

  // Use React hooks to update the plotly object, when the plot data changes.
  // based on https://github.com/plotly/react-plotly.js/issues/242.
  const plotRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    // Set the ID of the plot element to match the UUID, with a suffix for modal
    if (plotRef.current) {
      const elementId = isModal ? `${uuid}-modal` : uuid;
      plotRef.current.id = elementId;
      console.log("Setting plot element ID to:", elementId);
    }
    
    // @ts-ignore - Plotly.js is dynamically imported with an eval() call.
    Plotly.react(
      plotRef.current!,
      plotJson.data,
      plotJson.layout,
      plotJson.config,
    );
  }, [plotJson, uuid, isModal]); // Add isModal to dependencies

  return (
    <Paper
      ref={ref}
      className={folderWrapper}
      withBorder
      style={{ position: "relative" }}
    >
      <div ref={plotRef} id={isModal ? `${uuid}-modal` : uuid} />
      {/* Add a div on top of the plot, to prevent interaction + cursor changes. */}
      {staticPlot ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
          }}
        />
      ) : null}
    </Paper>
  );
});

export default function PlotlyComponent({
  props: { visible, _plotly_json_str: plotly_json_str, aspect },
  uuid, // Add this to get the component's UUID
}: GuiPlotlyMessage) {
  // Add logging before the visibility check
  // console.log("%c[PlotlyComponent] Rendering", "color: #FF5722; font-weight: bold; font-size: 14px", {
  //   visible,
  //   hasPlotlyData: !!plotly_json_str,
  //   aspect
  // });

  if (!visible) return null;

  console.log("%c[PlotlyComponent] Received update", "color: #4CAF50; font-weight: bold", {
    plotly_json_str: plotly_json_str?.substring(0, 100) + "...", // Show first 100 chars
    aspect,
    timestamp: new Date().toISOString(),
    visible
  });

  // // Print all UUIDs before trying to find the plot element
  // const allUuids = printAllUUIDs();
  // console.warn("PlotlyComponent: Available UUIDs:", allUuids);


  // Create a modal with the plot, and a button to open it.
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <Box>
      <Tooltip.Floating zIndex={100} label={"Click to expand"}>
        <Box
          style={{
            cursor: "pointer",
            flexShrink: 0,
            position: "relative",
          }}
          onClick={open}
        >
          <PlotWithAspect
            jsonStr={plotly_json_str}
            aspectRatio={aspect}
            staticPlot={true}
            uuid={uuid} // Pass the UUID to PlotWithAspect
          />
        </Box>
      </Tooltip.Floating>

      <Modal opened={opened} onClose={close} size="xl" keepMounted>
        <PlotWithAspect
          jsonStr={plotly_json_str}
          aspectRatio={aspect}
          staticPlot={false}
          uuid={uuid}
          isModal={true} // Add this prop to identify the modal plot
        />
      </Modal>
    </Box>
  );
}

// Component for handling plot updates
export function PlotlyUpdateComponent({
  props: { x_data, y_data, plotly_element_uuid },
}: GuiPlotlyUpdateMessage) {
  // Use React hooks to update the plotly object when new data arrives
  React.useEffect(() => {
    console.log("[PlotlyUpdateComponent] Received update:", {
      x_data,
      y_data,
      plotly_element_uuid,
      timestamp: new Date().toISOString()
    });

    // Find both the main plot and modal plot elements
    const mainPlotElement = document.getElementById(plotly_element_uuid);
    const modalPlotElement = document.getElementById(`${plotly_element_uuid}-modal`);
    
    if (!mainPlotElement && !modalPlotElement) {
      console.warn("Could not find any plot elements with UUID:", plotly_element_uuid);
      return;
    }

    // Update both plots with new data
    const updatePlot = (element: HTMLElement | null) => {
      if (!element) return;
      try {
        // @ts-ignore - Plotly.js is dynamically imported
        Plotly.extendTraces(
          element,
          {
            x: [[x_data]],
            y: [[y_data]]
          },
          [0], // Update the first trace
          50    // Keep only the last point
        );
      } catch (error) {
        console.error("Error updating plot:", error);
      }
    };

    updatePlot(mainPlotElement);
    updatePlot(modalPlotElement);
  }, [x_data, y_data, plotly_element_uuid]);

  // This component doesn't render anything visible
  return null;
}
