import React, { useEffect, useState, useRef, useMemo } from "react";
import uPlot from "uplot";
import UplotReact from "uplot-react";
import "uplot/dist/uPlot.min.css";

import { Modal, Box, Paper, Tooltip } from "@mantine/core";
import { useDisclosure, useElementSize } from "@mantine/hooks";
import { GuiUplotMessage } from "../WebsocketMessages";
import { folderWrapper } from "./Folder.css";


const PlotData = React.memo(function PlotData({
  aligned_data,
  data,
  mode = "main",
}: {
  aligned_data: number[][]; // managed by React
  data: number[][]; // managed by React
  mode?: "main" | "modal";
}) {

  const { ref: containerSizeRef, width: containerWidth } = useElementSize();
  const plotKey = mode === "main" ? "main-plot" : "modal-plot";

  // Store cursor position to restore after data update
  const lastCursorPos = useRef<{ left: number; top: number } | null>(null);

  // Store refs to uPlot instances
  const plotRef = useRef<uPlot | null>(null);

  // When data updates, restore cursor position on the plot instances
  useEffect(() => {
    const plot = plotRef.current;
    if (!plot) return;
    // Save last cursor position if available
    if (plot.cursor.left != null && plot.cursor.top != null) {
      lastCursorPos.current = {
        left: plot.cursor.left,
        top: plot.cursor.top
      };
    }
    // Update data
    plot.setData(data);
    // Restore cursor position
    if (lastCursorPos.current) {
      plot.setCursor(lastCursorPos.current);
    }
  }, [data]);

  const width = mode === "main" ? 400 : 800;

  // Shared options factory
  const sharedOptions = (w: number): uPlot.Options => ({
    width: w,
    height: w * 0.6,
    scales: {
      x: { time: false, range: (u, min, max) => [min, max] },
      y: { range: (u, min, max) => [min, max] },
    },
    axes: [{}],
    series: [
      {},
      ...aligned_data.slice(1).map((_, i) => ({
        label: `Trajectory ${i + 1}`,
        stroke: ["red", "green", "blue", "orange", "purple"][i % 5],
        width: 2,
      })),
    ],
    cursor: {
      show: true,
      drag: { setScale: true },
      points: { show: true, size: 4 },
    },
  });

  // Options state to support resizing or other changes
  const [options, setOptions] = useState<uPlot.Options>(() =>
    sharedOptions(width) // Default width for main plot
  );

  // Update options on container/modal resize
  useEffect(() => {
    if (containerWidth > 0) {
      setOptions(sharedOptions(containerWidth));
    }
  }, [containerWidth]);

  // Box size change -> width value change -> plot rerender trigger.
  // const { ref, width } = useElementSize();

  return (
    <Paper
      ref={containerSizeRef}
      className={folderWrapper}
      withBorder
      style={{ position: "relative", width: "100%" }}
    >
      <UplotReact
        key={plotKey}
        options={options}
        data={data}
        onCreate={(chart) => (plotRef.current = chart)}
        onDelete={(chart) => {
          if (plotRef.current === chart) plotRef.current = null;
        }}
      />
    </Paper>
  );
});



export default function UplotComponent({
  props: { aligned_data },
}: GuiUplotMessage) {

  // Create a modal with the plot, and a button to open it.
  const [opened, { open, close }] = useDisclosure(false);

  // Convert inputs to Float64Array once per update
  const alignedData = useMemo<uPlot.AlignedData>(() => {
    const y = aligned_data.map((traj) => new Float64Array(traj));
    return [...y];
  }, [aligned_data]);

  // Data state managed by React
  const [data, setData] = useState<uPlot.AlignedData>(alignedData);

  // Update data state when inputs change
  useEffect(() => {
    setData(alignedData);
  }, [alignedData]);



  // const { ref: containerSizeRef, width: containerWidth } = useElementSize();
  // const { ref: modalSizeRef, width: modalWidth } = useElementSize();

  // // Stable key so React doesn't recreate plot unnecessarily
  // const plotKey = "main-plot";
  // const modalPlotKey = "modal-plot";

  // // Convert inputs to Float64Array once per update
  // const alignedData = useMemo<uPlot.AlignedData>(() => {
  //   const y = aligned_data.map((traj) => new Float64Array(traj));
  //   return [...y];
  // }, [aligned_data]);

  // console.log("alignedData", alignedData);
  // console.log("shape alignedData", alignedData.length);
  // console.log("shape aligned_data", aligned_data.length);

  // // Data state managed by React
  // const [data, setData] = useState<uPlot.AlignedData>(alignedData);

  // // Update data state when inputs change
  // useEffect(() => {
  //   setData(alignedData);
  // }, [alignedData]);

  // // Store cursor position to restore after data update
  // const lastCursorPos = useRef<{ left: number; top: number } | null>(null);

  // // Store refs to uPlot instances
  // const plotRef = useRef<uPlot | null>(null);
  // const modalPlotRef = useRef<uPlot | null>(null);

  // // When data updates, restore cursor position on the plot instances
  // useEffect(() => {
  //   [plotRef.current, modalPlotRef.current].forEach((plot) => {
  //     if (!plot) return;
  //     // Save last cursor position if available
  //     if (plot.cursor.left != null && plot.cursor.top != null) {
  //       lastCursorPos.current = {
  //         left: plot.cursor.left,
  //         top: plot.cursor.top
  //       };
  //     }
  //     // Update data
  //     plot.setData(data);
  //     // Restore cursor position
  //     if (lastCursorPos.current) {
  //       plot.setCursor(lastCursorPos.current);
  //     }
  //   });
  // }, [data]);

  // // Shared options factory
  // const sharedOptions = (w: number): uPlot.Options => ({
  //   width: w,
  //   height: w * 0.6,
  //   scales: {
  //     x: { time: false, range: (u, min, max) => [min, max] },
  //     y: { range: (u, min, max) => [min, max] },
  //   },
  //   axes: [{}],
  //   series: [
  //     {},
  //     ...aligned_data.slice(1).map((_, i) => ({
  //       label: `Trajectory ${i + 1}`,
  //       stroke: ["red", "green", "blue", "orange", "purple"][i % 5],
  //       width: 2,
  //     })),
  //   ],
  //   cursor: {
  //     show: true,
  //     drag: { setScale: true },
  //     points: { show: true, size: 4 },
  //   },
  // });

  // // Options state to support resizing or other changes
  // const [mainOptions, setMainOptions] = useState<uPlot.Options>(() =>
  //   sharedOptions(400) // Default width for main plot
  // );
  // const [modalOptions, setModalOptions] = useState<uPlot.Options>(() =>
  //   sharedOptions(800) // Default width for modal plot
  // );

  // // Update options on container/modal resize
  // useEffect(() => {
  //   if (containerWidth > 0) {
  //     setMainOptions(sharedOptions(containerWidth));
  //   }
  // }, [containerWidth]);

  // useEffect(() => {
  //   if (modalWidth > 0) {
  //     setModalOptions(sharedOptions(modalWidth));
  //   }
  // }, [modalWidth]);

  return (
    <Box>
      <Tooltip.Floating label="Click to expand" zIndex={100}>
        <Box onClick={open} style={{ cursor: "pointer", flexShrink: 0 }}>
          <PlotData
            aligned_data={aligned_data}
            data={data}
            mode="main"
          />
        </Box>
      </Tooltip.Floating>

      <Modal opened={opened} onClose={close} size="xl" keepMounted>
        <PlotData
          aligned_data={aligned_data}
          data={data}
          mode="modal"
        />
      </Modal>
    </Box>
  );
}
