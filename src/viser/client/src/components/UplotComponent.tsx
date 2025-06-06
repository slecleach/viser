import React from "react";
import { GuiUplotMessage } from "../WebsocketMessages";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Box, Paper, Tooltip } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import uPlot from "uplot";
import UplotReact from 'uplot-react';
import "uplot/dist/uPlot.min.css";




// had to install uplot manually:
// cd src/viser/client && npm install uplot
// cd src/viser/client && npm install uplot-react uplot


//  When drawing border around the plot, it should be aligned with the folder's.
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
    console.log("[UplotWithAspect] Data:", { x_data, y_data });

    const opts: uPlot.Options = {
      width: width,
      height: width * 0.6, // Maintain aspect ratio
      pxAlign: false,
      scales: {
        y: {
          range: (u: uPlot, min: number, max: number): [number, number] => [min, max],
        }
      },
      series: [
        {}, // x-axis
        {
          label: "Data",
          stroke: "red",
          fill: "rgba(255,0,0,0.1)",
        },
      ],
    };

    // Convert data to the format uPlot expects
    const data: uPlot.AlignedData = [
      new Float64Array(x_data),
      new Float64Array(y_data)
    ];

    // If we already have a plot instance, just update the data
    if (uplotInstance.current) {
      console.log("[UplotWithAspect] Updating existing plot");
      uplotInstance.current.setData(data);
    } else {
      console.log("[UplotWithAspect] Creating new plot");
      // Create new uPlot instance
      uplotInstance.current = new uPlot(opts, data, plotRef.current);
    }


    const Chart = () => (
        <UplotReact options={options} data={data} target={target} onCreate={(chart) => {}} onDelete={(chart) => {}} />
    );


    // Cleanup on unmount
    return () => {
      if (uplotInstance.current) {
        uplotInstance.current.destroy();
        uplotInstance.current = null;
      }
    };
  }, [width, x_data, y_data]);

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


  const data = [
    [0, 1, 2, 3, 4, 5],
    [0, 1, 2, 3, 4, 5],
  ];

  const options = {
      width: 400,
      height: 300,
      scales: {
          x: {
              time: false,
              range: [-0.5, 5.5],
          },
          y: {},
      },
      axes: [{}],
      series: [
          {},
          {
              stroke: 'blue',
          },
      ],
  };
  const { ref, width } = useElementSize();

  const Chart = () => <UplotReact options={options} data={data} onCreate={(chart) => {}} onDelete={(chart) => {}} />;

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
          {/* <UplotWithAspect
            x_data={x_data}
            y_data={y_data}
          /> */}
          {
            <Paper
            ref={ref}
            className={folderWrapper}
            withBorder
            style={{
              position: "relative",
              width: "95%",
            }}
          >
            <Chart />
          </Paper>
          }
        </Box>
      </Tooltip.Floating>

      {/* Modal contents. keepMounted makes state changes (eg zoom) to the plot
      persistent. */}
      <Modal opened={opened} onClose={close} size="xl" keepMounted>
        {/* <UplotWithAspect
          x_data={x_data}
          y_data={y_data}
        /> */}
      </Modal>
    </Box>
  );
}
