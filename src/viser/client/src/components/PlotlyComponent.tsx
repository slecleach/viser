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
}: {
  jsonStr: string;
  aspectRatio: number;
  staticPlot: boolean;
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
    // @ts-ignore - Plotly.js is dynamically imported with an eval() call.
    Plotly.react(
      plotRef.current!,
      plotJson.data,
      plotJson.layout,
      plotJson.config,
    );
  }, [plotJson]);

  return (
    <Paper
      ref={ref}
      className={folderWrapper}
      withBorder
      style={{ position: "relative" }}
    >
      <div ref={plotRef} />
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
}: GuiPlotlyMessage) {
  // Add logging before the visibility check
  console.log("%c[PlotlyComponent] Rendering", "color: #FF5722; font-weight: bold; font-size: 14px", {
    visible,
    hasPlotlyData: !!plotly_json_str,
    aspect
  });

  if (!visible) return null;

  console.log("%c[PlotlyComponent] Received update", "color: #4CAF50; font-weight: bold", {
    plotly_json_str: plotly_json_str?.substring(0, 100) + "...", // Show first 100 chars
    aspect,
    timestamp: new Date().toISOString(),
    visible
  });

  // Print all UUIDs before trying to find the plot element
  const allUuids = printAllUUIDs();
  console.warn("PlotlyComponent: Available UUIDs:", allUuids);


  // Create a modal with the plot, and a button to open it.
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <Box>
      {/* Draw static plot in the controlpanel, which can be clicked. */}
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
          />
        </Box>
      </Tooltip.Floating>

      {/* Modal contents. keepMounted makes state changes (eg zoom) to the plot
      persistent. */}
      <Modal opened={opened} onClose={close} size="xl" keepMounted>
        <PlotWithAspect
          jsonStr={plotly_json_str}
          aspectRatio={aspect}
          staticPlot={false}
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
    console.log("PlotlyUpdateComponent received update:", {
      x_data,
      y_data,
      plotly_element_uuid,
      timestamp: new Date().toISOString()
    });

    // Print all UUIDs before trying to find the plot element
    const allUuids = printAllUUIDs();
    console.warn("UPDATE: Looking for plot element with UUID:", plotly_element_uuid);
    console.warn("UPDATE: Available UUIDs:", allUuids);


    // Find the plot element by its UUID
    const plotElement = document.getElementById(plotly_element_uuid);
    console.log("Found plot element:", plotElement);
    
    if (!plotElement) {
      console.warn("Could not find plot element with UUID:", plotly_element_uuid);
      return;
    }

    // Update the plot with new data
    try {
      // @ts-ignore - Plotly.js is dynamically imported
      Plotly.extendTraces(
        plotElement,
        {
          x: [[x_data]],
          y: [[y_data]]
        },
        [0], // Update the first trace
        1    // Keep only the last point
      );
      console.log("Successfully updated plot with new data point");
    } catch (error) {
      console.error("Error updating plot:", error);
    }
  }, [x_data, y_data, plotly_element_uuid]);

  // This component doesn't render anything visible
  return null;
}
