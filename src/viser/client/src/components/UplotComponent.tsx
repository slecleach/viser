import React, { useEffect, useState, useRef, useMemo } from "react";
import uPlot from "uplot";
import UplotReact from "uplot-react";
import "uplot/dist/uPlot.min.css";

import { Modal, Box, Paper, Tooltip } from "@mantine/core";
import { useDisclosure, useElementSize } from "@mantine/hooks";
import { GuiUplotMessage } from "../WebsocketMessages";
import { folderWrapper } from "./Folder.css";


const PlotData = React.memo(function PlotData({
  data,
  options,
  isVisible = true,
  aspectRatio = 0.6,
}: {
  data: number[][]; // managed by React
  options: { [key: string]: any };  // Equivalent to Python's dict[str, Any]
  isVisible?: boolean;
  aspectRatio?: number;
}) {
  // Box size change -> width value change -> plot rerender trigger.
  const { ref: containerSizeRef, width: containerWidth } = useElementSize();

  // Store cursor position to restore after data update
  const lastCursorPos = useRef<{ left: number; top: number } | null>(null);

  // Store refs to uPlot instances
  const plotRef = useRef<uPlot | null>(null);


  // When data updates, restore cursor position on the plot instances
  useEffect(() => {
    if (!isVisible) return; // Skip updates if not visible
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
  }, [data, isVisible]);

  // Number of trajectories
  const num_traj = data.length - 1;

  // Options factory:
  // width, height and cursor are managed on the typescript side.
  // additional options (i.e. scales, axes, series) are managed by the user on the python side.
  const getOptions = (w: number): uPlot.Options => ({
    width: w,
    height: w * aspectRatio,
    cursor: {
      show: true,
      drag: { setScale: true },
      points: { show: true, size: 4 },
    },
    ...options, // merge with user-defined options e.g. scales, axes, series
  });

  // Options state to support resizing or other changes
  const [uplotOptions, setOptions] = useState<uPlot.Options>(() =>
    getOptions(containerWidth) // Default width for main plot
  );

  // Update options on container/modal resize
  useEffect(() => {
    if (containerWidth > 0) {
      setOptions(getOptions(containerWidth));
    }
  }, [containerWidth]);

  return (
    <Paper
      ref={containerSizeRef}
      className={folderWrapper}
      withBorder
      style={{ position: "relative"}}
    >
      <UplotReact
        options={uplotOptions}
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
  props: { aligned_data, options },
}: GuiUplotMessage) {

  // Create a modal with the plot, and a button to open it.
  const [opened, { open, close }] = useDisclosure(false);

  // Convert inputs to Float32Array once per update
  const alignedData = useMemo<uPlot.AlignedData>(() => {
    const traj = aligned_data.map((traj) => new Float32Array(traj));
    return [...traj];
  }, [aligned_data]);

  // Data state managed by React
  const [data, setData] = useState<uPlot.AlignedData>(alignedData);

  // Update data state when inputs change
  useEffect(() => {
    setData(alignedData);
  }, [alignedData]);

  return (
    <Box>
      <Tooltip.Floating label="Click to expand" zIndex={100}>
        <Box onClick={open} style={{ cursor: "pointer", flexShrink: 0 }}>
          <PlotData
            data={data}
            options={options}
            isVisible={true}
            aspectRatio={0.6}
          />
        </Box>
      </Tooltip.Floating>

      <Modal opened={opened} onClose={close} size="xl" keepMounted>
        <PlotData
          data={data}
          options={options}
          isVisible={opened}
          aspectRatio={0.6}
        />
      </Modal>
    </Box>
  );
}
