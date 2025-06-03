import React from "react";
import { GuiUplotMessage } from "../WebsocketMessages";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Box, Paper, Tooltip } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

// had to install uplot manually:
// cd src/viser/client && npm install uplot


// When drawing border around the plot, it should be aligned with the folder's.
import { folderWrapper } from "./Folder.css";

const UplotWithAspect = React.memo(function UplotWithAspect({
  x_data,
  y_data,
}: {
  x_data: number[];
  y_data: number[];
}) {
  // Box size change -> width value change -> plot rerender trigger.
  const { ref, width } = useElementSize();
  const plotRef = React.useRef<HTMLDivElement>(null);
  const uplotInstance = React.useRef<uPlot | null>(null);

  // Initialize uPlot with the data
  React.useEffect(() => {
    if (!width || !plotRef.current) return;

    console.log("[UplotWithAspect] Starting initialization with width:", width);

    // Generate test data
    const length = 100;
    const xs = Array.from({length}, (_, i) => i);
    const ys = Array.from({length}, (_, i) => Math.sin(i / 10) * 5);
    console.log("[UplotWithAspect] Generated test data:", { xs, ys });

    const opts = {
      width: width,
      height: width * 0.6, // Maintain aspect ratio
      pxAlign: false,
      scales: {
        y: {
          range: [-6, 6],
        }
      },
      series: [
        {}, // x-axis
        {
          label: "Test Data",
          stroke: "red",
          fill: "rgba(255,0,0,0.1)",
        },
      ],
    };

    const data = [xs, ys];
    console.log("[UplotWithAspect] Plot options:", opts);
    console.log("[UplotWithAspect] Plot data:", data);

    // Destroy previous instance if it exists
    if (uplotInstance.current) {
      uplotInstance.current.destroy();
    }

    // Create new uPlot instance
    uplotInstance.current = new uPlot(opts, data, plotRef.current);
    console.log("[UplotWithAspect] Plot created successfully");

    // Cleanup on unmount
    return () => {
      if (uplotInstance.current) {
        uplotInstance.current.destroy();
        uplotInstance.current = null;
      }
    };
  }, [width]);

  console.log("[UplotWithAspect] Return statement");
  return (
    <Paper
      ref={ref}
      className={folderWrapper}
      withBorder
      style={{
        position: "relative",
        width: "95%",
      }}
    >
      <div ref={plotRef} style={{ width: "100%", height: "100%" }} />
    </Paper>
  );
});

export default function UplotComponent({
  props: { x_data, y_data },
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
