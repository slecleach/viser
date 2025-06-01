import React from "react";
import { GuiPlotlyMessage, GuiPlotlyExtendTracesMessage } from "../WebsocketMessages";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Box, Paper, Tooltip } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";

// When drawing border around the plot, it should be aligned with the folder's.
import { folderWrapper } from "./Folder.css";


const PlotWithAspect = React.memo(function PlotWithAspect({
  plotJson,
  aspectRatio,
  staticPlot,
  uuid,
}: {
  plotJson: any;
  aspectRatio: number;
  staticPlot: boolean;
  uuid: string;
}) {
  // Catch if the plotJson is empty; if so, render an empty div.
  if (!plotJson) return <div></div>;

  // This keeps the zoom-in state, etc, see https://plotly.com/javascript/uirevision/.
  plotJson.layout.uirevision = "true";

  // Box size change -> width value change -> plot rerender trigger.
  const { ref, width } = useElementSize();
  const plotWidth = width || 1; // Fallback to 1 if width is 0, the main plot's elementSize is 0.
  plotJson.layout.width = plotWidth;
  plotJson.layout.height = plotWidth * aspectRatio;
  console.warn("plotWidth", plotWidth);
  console.warn("plotJson.layout.width", plotJson.layout.width);
  console.warn("plotJson.layout.height", plotJson.layout.height);
  console.warn("aspectRatio", aspectRatio);

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
    // Set the ID of the plot element
    if (plotRef.current) {
      plotRef.current.id = uuid;
    }

    // @ts-ignore - Plotly.js is dynamically imported with an eval() call.
    Plotly.react(
      plotRef.current!,
      plotJson.data,
      plotJson.layout,
      plotJson.config,
    );
  }, [plotJson, uuid, plotWidth]); // Re-render when plot data or width changes

  return (
    <Paper
      ref={ref}
      className={folderWrapper}
      withBorder
      style={{ position: "relative" }}
    >
      <div ref={plotRef} id={uuid} />
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
  uuid,
}: GuiPlotlyMessage) {
  if (!visible) return null;

  // Parse the JSON string once and maintain it as an object
  const [plotJson, setPlotJson] = React.useState(() => JSON.parse(plotly_json_str));

  // Make a copy of the plotJson for modal plot
  const [modalPlotJson, setModalPlotJson] = React.useState(() => JSON.parse(plotly_json_str));

  // Update plot data when new JSON string comes in
  React.useEffect(() => {
    setPlotJson(JSON.parse(plotly_json_str));
    setModalPlotJson(JSON.parse(plotly_json_str));
  }, [plotly_json_str]);

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
            plotJson={plotJson}
            aspectRatio={aspect}
            staticPlot={true}
            uuid={uuid}
          />
        </Box>
      </Tooltip.Floating>

      <Modal opened={opened} onClose={close} size="xl" keepMounted>
        <PlotWithAspect
          plotJson={modalPlotJson}
          aspectRatio={aspect}
          staticPlot={false}
          uuid={`${uuid}-modal`}
        />
      </Modal>
    </Box>
  );
}

// Component for handling plot updates
export function PlotlyExtendTracesComponent({
  props: { plotly_element_uuid, x_data, y_data, history_length },
}: GuiPlotlyExtendTracesMessage) {
  // Use React hooks to update the plotly object when new data arrives
  React.useEffect(() => {
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
          history_length
        );
      } catch (error) {
        console.error("Error updating plot:", error);
      }
    };

    updatePlot(mainPlotElement);
    updatePlot(modalPlotElement);
  }, [plotly_element_uuid, x_data, y_data, history_length]);

  // This component doesn't render anything visible
  return null;
}
