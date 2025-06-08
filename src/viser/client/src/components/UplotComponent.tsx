import React, { useEffect, useState, useRef, useMemo } from "react";
import uPlot from "uplot";
import UplotReact from "uplot-react";
import "uplot/dist/uPlot.min.css";

import { Modal, Box, Paper, Tooltip } from "@mantine/core";
import { useDisclosure, useElementSize } from "@mantine/hooks";
import { GuiUplotMessage } from "../WebsocketMessages";
import { folderWrapper } from "./Folder.css";







export default function UplotComponent({
  props: { aligned_data },
}: GuiUplotMessage) {
  const [opened, { open, close }] = useDisclosure(false);
  const { ref: containerSizeRef, width: containerWidth } = useElementSize();
  const { ref: modalSizeRef, width: modalWidth } = useElementSize();

  // Stable key so React doesn't recreate plot unnecessarily
  const plotKey = "main-plot";
  const modalPlotKey = "modal-plot";

  // Convert inputs to Float64Array once per update
  const alignedData = useMemo<uPlot.AlignedData>(() => {
    const y = aligned_data.map((traj) => new Float64Array(traj));
    return [...y];
  }, [aligned_data]);

  console.log("alignedData", alignedData);
  console.log("shape alignedData", alignedData.length);
  console.log("shape aligned_data", aligned_data.length);

  // Data state managed by React
  const [data, setData] = useState<uPlot.AlignedData>(alignedData);

  // Update data state when inputs change
  useEffect(() => {
    setData(alignedData);
  }, [alignedData]);

  // Store cursor position to restore after data update
  const lastCursorPos = useRef<{ left: number; top: number } | null>(null);

  // Store refs to uPlot instances
  const plotRef = useRef<uPlot | null>(null);
  const modalPlotRef = useRef<uPlot | null>(null);

  // When data updates, restore cursor position on the plot instances
  useEffect(() => {
    [plotRef.current, modalPlotRef.current].forEach((plot) => {
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
    });
  }, [data]);

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
  const [mainOptions, setMainOptions] = useState<uPlot.Options>(() =>
    sharedOptions(400) // Default width for main plot
  );
  const [modalOptions, setModalOptions] = useState<uPlot.Options>(() =>
    sharedOptions(800) // Default width for modal plot
  );

  // Update options on container/modal resize
  useEffect(() => {
    if (containerWidth > 0) {
      setMainOptions(sharedOptions(containerWidth));
    }
  }, [containerWidth]);

  useEffect(() => {
    if (modalWidth > 0) {
      setModalOptions(sharedOptions(modalWidth));
    }
  }, [modalWidth]);

  return (
    <Box>
      <Tooltip.Floating label="Click to expand" zIndex={100}>
        <Box onClick={open} style={{ cursor: "pointer", flexShrink: 0 }}>
          <Paper
            ref={containerSizeRef}
            className={folderWrapper}
            withBorder
            style={{ position: "relative", width: "100%" }}
          >
            <UplotReact
              key={plotKey}
              options={mainOptions}
              data={data}
              onCreate={(chart) => (plotRef.current = chart)}
              onDelete={(chart) => {
                if (plotRef.current === chart) plotRef.current = null;
              }}
            />
          </Paper>
        </Box>
      </Tooltip.Floating>

      <Modal opened={opened} onClose={close} size="xl" keepMounted>
        <Paper
          ref={modalSizeRef}
          className={folderWrapper}
          withBorder
          style={{ position: "relative", width: "100%", height: "600px", padding: "20px" }}
        >
          <UplotReact
            key={modalPlotKey}
            options={modalOptions}
            data={data}
            onCreate={(chart) => (modalPlotRef.current = chart)}
            onDelete={(chart) => {
              if (modalPlotRef.current === chart) modalPlotRef.current = null;
            }}
          />
        </Paper>
      </Modal>
    </Box>
  );
}
