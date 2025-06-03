import React from "react";
import { GuiUplotMessage } from "../WebsocketMessages";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Box, Paper, Tooltip } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";

// When drawing border around the plot, it should be aligned with the folder's.
import { folderWrapper } from "./Folder.css";

const UplotWithAspect = React.memo(function UplotWithAspect({
  x_data,
  y_data,
}: {
  x_data: number[];
  y_data: number[];
}) {
  // Catch if the x_data or y_data is empty; if so, render an empty div.
  if (x_data.length === 0 || y_data.length === 0) return <div></div>;



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

export default function UplotComponent({
  props: { _x_data: x_data, _y_data: y_data },
}: GuiUplotMessage) {

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
          <UplotWithAspect
            x_data={x_data}
            y_data={y_data}
          />
        </Box>
      </Tooltip.Floating>

      {/* Modal contents. keepMounted makes state changes (eg zoom) to the plot
      persistent. */}
      <Modal opened={opened} onClose={close} size="xl" keepMounted>
        <UplotWithAspect
          x_data={x_data}
          y_data={y_data}
        />
      </Modal>
    </Box>
  );
}
