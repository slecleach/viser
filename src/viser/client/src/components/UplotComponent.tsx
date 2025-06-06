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
  props: {x_data, y_data },
}: GuiUplotMessage) {
  console.warn("UplotComponent render with props:", { x_data, y_data });

  // Validate data
  if (!Array.isArray(x_data) || !Array.isArray(y_data)) {
    console.error("Invalid data: x_data and y_data must be arrays");
    return null;
  }

  if (x_data.length !== y_data.length) {
    console.error("Invalid data: x_data and y_data must have the same length");
    return null;
  }

  if (x_data.length === 0) {
    console.error("Invalid data: arrays cannot be empty");
    return null;
  }

  const [opened, { open, close }] = useDisclosure(false);
  const { ref, width } = useElementSize();
  const modalRef = React.useRef<HTMLDivElement>(null);
  const { width: modalWidth } = useElementSize({ ref: modalRef });
  const plotRef = React.useRef<uPlot | null>(null);
  const modalPlotRef = React.useRef<uPlot | null>(null);
  const [updateKey, setUpdateKey] = React.useState(0);

  // Log initial mount
  React.useEffect(() => {
    console.warn("UplotComponent mounted");
    return () => console.warn("UplotComponent unmounted");
  }, []);

  // Update plot data when props change
  React.useEffect(() => {
    console.warn("Data changed:", {
      x_data_length: x_data.length,
      y_data_length: y_data.length,
      x_data_sample: x_data.slice(0, 3),
      y_data_sample: y_data.slice(0, 3)
    });

    // Ensure data is valid before creating Float64Array
    const validXData = x_data.filter(x => typeof x === 'number' && !isNaN(x));
    const validYData = y_data.filter(y => typeof y === 'number' && !isNaN(y));

    if (validXData.length === 0 || validYData.length === 0) {
      console.error("No valid numeric data points found");
      return;
    }

    const newData: uPlot.AlignedData = [
      new Float64Array(validXData),
      new Float64Array(validYData)
    ];

    if (plotRef.current) {
      console.warn("Updating main plot data");
      try {
        plotRef.current.setData(newData);
      } catch (e) {
        console.error("Error updating main plot:", e);
      }
    }
    if (modalPlotRef.current) {
      console.warn("Updating modal plot data");
      try {
        modalPlotRef.current.setData(newData);
      } catch (e) {
        console.error("Error updating modal plot:", e);
      }
    }

    // Force re-render
    setUpdateKey(prev => prev + 1);
  }, [x_data, y_data]);

  const options: uPlot.Options = {
    width: width || 400,
    height: (width || 400) * 0.6,
    scales: {
      x: {
        time: false,
        range: (u: uPlot, min: number, max: number): [number, number] => [min, max],
      },
      y: {
        range: (u: uPlot, min: number, max: number): [number, number] => [min, max],
      },
    },
    axes: [{}],
    series: [
      {}, // x-axis
      {
        stroke: 'blue',
        width: 2,
      },
    ],
  };

  const modal_options: uPlot.Options = {
    width: 0.8 * modalWidth || 700,
    height: (0.8 * modalWidth || 700) * 0.6,
    scales: {
      x: {
        time: false,
        range: (u: uPlot, min: number, max: number): [number, number] => [min, max],
      },
      y: {
        range: (u: uPlot, min: number, max: number): [number, number] => [min, max],
      },
    },
    axes: [{}],
    series: [
      {}, // x-axis
      {
        stroke: 'blue',
        width: 2,
      },
    ],
  };

  // Ensure data is valid before creating Float64Array
  const validXData = x_data.filter(x => typeof x === 'number' && !isNaN(x));
  const validYData = y_data.filter(y => typeof y === 'number' && !isNaN(y));

  if (validXData.length === 0 || validYData.length === 0) {
    console.error("No valid numeric data points found");
    return null;
  }

  const initialData: uPlot.AlignedData = [
    new Float64Array(validXData),
    new Float64Array(validYData)
  ];

  console.warn("Rendering with data:", {
    data_length: initialData[0].length,
    updateKey
  });

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
          <Paper
            ref={ref}
            className={folderWrapper}
            withBorder
            style={{
              position: "relative",
              width: "95%",
            }}
          >
            <UplotReact 
              key={`main-plot-${updateKey}`}
              options={options} 
              data={initialData} 
              onCreate={(chart) => {
                console.log("Main plot created with data length:", initialData[0].length);
                plotRef.current = chart;
              }} 
              onDelete={(chart) => {
                console.log("Main plot deleted");
                if (plotRef.current === chart) {
                  plotRef.current = null;
                }
              }} 
            />
          </Paper>
        </Box>
      </Tooltip.Floating>

      <Modal opened={opened} onClose={close} size="xl">
        <Modal.Body>
          <Box ref={modalRef}>
            <UplotReact 
              key={`modal-plot-${updateKey}`}
              options={modal_options} 
              data={initialData} 
              onCreate={(chart) => {
                console.log("Modal plot created with data length:", initialData[0].length);
                modalPlotRef.current = chart;
              }} 
              onDelete={(chart) => {
                console.log("Modal plot deleted");
                if (modalPlotRef.current === chart) {
                  modalPlotRef.current = null;
                }
              }} 
            />
          </Box>
        </Modal.Body>
      </Modal>
    </Box>
  );
}
