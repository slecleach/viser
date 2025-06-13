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
  aspectRatio = 0.75,
  isVisible = true,
}: {
  data: number[][]; // managed by React
  options: { [key: string]: any };
  aspectRatio?: number;
  isVisible?: boolean;
}) {
  const { ref: containerSizeRef, width: containerWidth } = useElementSize();
  const plotRef = useRef<uPlot | null>(null);
  const lastCursorPos = useRef<{ left: number; top: number } | null>(null);

  // Save cursor before destroying plot
  const handleDelete = (chart: uPlot) => {
    if (plotRef.current === chart) {
      if (chart.cursor.left != null && chart.cursor.top != null) {
        lastCursorPos.current = {
          left: chart.cursor.left,
          top: chart.cursor.top,
        };
      }
      plotRef.current = null;
    }
  };

  // Restore cursor after creating plot
  const handleCreate = (chart: uPlot) => {
    plotRef.current = chart;
    if (lastCursorPos.current) {
      chart.setCursor(lastCursorPos.current);
    }
  };

  // Get fresh options when container size changes
  const uplotOptions = useMemo(() => {
    if (containerWidth <= 0) return undefined;
    return {
      width: containerWidth,
      height: containerWidth * aspectRatio,
      cursor: {
        show: true,
        drag: { setScale: true },
        points: { show: true, size: 4 },
      },
      ...options,
    };
  }, [containerWidth, aspectRatio, options]);

  // Update data (does not reset cursor)
  useEffect(() => {
    if (!isVisible || !plotRef.current) return;
    plotRef.current.setData(data);
  }, [data, isVisible]);

  return (
    <Paper
      ref={containerSizeRef}
      className={folderWrapper}
      withBorder
      style={{ position: "relative" }}
    >
      {uplotOptions && (
        <UplotReact
          options={uplotOptions}
          data={data}
          onCreate={handleCreate}
          onDelete={handleDelete}
        />
      )}
    </Paper>
  );
});


// const PlotData = React.memo(function PlotData({
//   data,
//   options,
//   aspectRatio,
//   isVisible = true,
// }: {
//   data: number[][]; // managed by React
//   options: { [key: string]: any };  // Equivalent to Python's dict[str, Any]
//   aspectRatio?: number;
//   isVisible?: boolean;
// }) {
//   // Box size change -> width value change -> plot rerender trigger.
//   const { ref: containerSizeRef, width: containerWidth } = useElementSize();

//   // Store cursor position to restore after data update
//   const lastCursorPos = useRef<{ left: number; top: number } | null>(null);

//   // Store refs to uPlot instances
//   const plotRef = useRef<uPlot | null>(null);


//   // When data updates, restore cursor position on the plot instances
//   useEffect(() => {
//     if (!isVisible) return; // Skip updates if not visible
//     const plot = plotRef.current;
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
//   }, [data, options, aspectRatio, isVisible]);

//   // Options factory:
//   // width, height and cursor are managed on the typescript side.
//   // additional options (i.e. scales, axes, series) are managed by the user on the python side.
//   const getOptions = (w: number): uPlot.Options => ({
//     width: w,
//     height: w * aspectRatio,
//     cursor: {
//       show: true,
//       drag: { setScale: true },
//       points: { show: true, size: 4 },
//     },
//     ...options, // merge with user-defined options e.g. scales, axes, series
//   });

//   // Options state to support resizing or other changes
//   const [uplotOptions, setOptions] = useState<uPlot.Options>(() =>
//     getOptions(containerWidth) // Default width for main plot
//   );

//   // Update options on container/modal resize
//   useEffect(() => {
//     if (!isVisible) return; // Skip updates if not visible
//     const plot = plotRef.current;
//     if (!plot) return;
//     // Save last cursor position if available
//     if (plot.cursor.left != null && plot.cursor.top != null) {
//       lastCursorPos.current = {
//         left: plot.cursor.left,
//         top: plot.cursor.top
//       };
//     }
//     // Update options
//     if (containerWidth > 0) {
//       setOptions(getOptions(containerWidth));
//     }
//     // Restore cursor position
//     if (lastCursorPos.current) {
//       plot.setCursor(lastCursorPos.current);
//     }
//   }, [containerWidth, options, aspectRatio, isVisible]);

//   return (
//     <Paper
//       ref={containerSizeRef}
//       className={folderWrapper}
//       withBorder
//       style={{ position: "relative"}}
//     >
//       <UplotReact
//         options={uplotOptions}
//         data={data}
//         onCreate={(chart) => (plotRef.current = chart)}
//         onDelete={(chart) => {
//           if (plotRef.current === chart) plotRef.current = null;
//         }}
//       />
//     </Paper>
//   );
// });

export default function UplotComponent({
  props: { aligned_data, options, aspect },
}: GuiUplotMessage) {

  // Create a modal with the plot, and a button to open it.
  const [opened, { open, close }] = useDisclosure(false);

  // Convert inputs to Float32Array once per update
  const alignedData = useMemo<uPlot.AlignedData>(() => {
    const traj = aligned_data.map((traj) => new Float32Array(traj));
    return [...traj];
  }, [aligned_data]);

  return (
    <Box>
      <Tooltip.Floating label="Click to expand" zIndex={100}>
        <Box onClick={open} style={{ cursor: "pointer", flexShrink: 0 }}>
          <PlotData
            data={alignedData}
            options={options}
            aspectRatio={aspect}
            isVisible={true}
          />
        </Box>
      </Tooltip.Floating>

      <Modal opened={opened} onClose={close} size="xl" keepMounted>
        <PlotData
          data={alignedData}
          options={options}
          aspectRatio={aspect}
          isVisible={opened}
        />
      </Modal>
    </Box>
  );
}
