// import React from "react";
// import { GuiUplotMessage } from "../WebsocketMessages";
// import { useDisclosure } from "@mantine/hooks";
// import { Modal, Box, Paper, Tooltip } from "@mantine/core";
// import { useElementSize } from "@mantine/hooks";
// import uPlot from "uplot";
// import UplotReact from 'uplot-react';
// import "uplot/dist/uPlot.min.css";


// // had to install uplot manually:
// // cd src/viser/client && npm install uplot
// // cd src/viser/client && npm install uplot-react uplot


// //  When drawing border around the plot, it should be aligned with the folder's.
// import { folderWrapper } from "./Folder.css";

// const UplotWithAspect = React.memo(function UplotWithAspect({
//   x_data,
//   y_data,
// }: {
//   x_data: number[];
//   y_data: number[];
// }) {
//   // Box size change -> width value change -> plot rerender trigger.
//   const { ref, width } = useElementSize();
//   const plotRef = React.useRef<HTMLDivElement>(null);
//   const uplotInstance = React.useRef<uPlot | null>(null);

//   // Initialize uPlot with the data
//   React.useEffect(() => {
//     if (!width || !plotRef.current) return;

//     // console.log("[UplotWithAspect] Starting initialization with width:", width);
//     // console.log("[UplotWithAspect] Data:", { x_data, y_data });

//     const opts: uPlot.Options = {
//       width: width,
//       height: width * 0.6, // Maintain aspect ratio
//       pxAlign: false,
//       scales: {
//         y: {
//           range: (u: uPlot, min: number, max: number): [number, number] => [min, max],
//         }
//       },
//       series: [
//         {}, // x-axis
//         {
//           label: "Data",
//           stroke: "red",
//           fill: "rgba(255,0,0,0.1)",
//         },
//       ],
//     };

//     // Convert data to the format uPlot expects
//     const data: uPlot.AlignedData = [
//       new Float64Array(x_data),
//       new Float64Array(y_data)
//     ];

//     // If we already have a plot instance, just update the data
//     if (uplotInstance.current) {
//       // console.log("[UplotWithAspect] Updating existing plot");
//       uplotInstance.current.setData(data);
//     } else {
//       // console.log("[UplotWithAspect] Creating new plot");
//       // Create new uPlot instance
//       uplotInstance.current = new uPlot(opts, data, plotRef.current);
//     }

//     // Cleanup on unmount
//     return () => {
//       if (uplotInstance.current) {
//         uplotInstance.current.destroy();
//         uplotInstance.current = null;
//       }
//     };
//   }, [width, x_data, y_data]);

//   // console.log("[UplotWithAspect] Return statement");
//   return (
//     <Paper
//       ref={ref}
//       className={folderWrapper}
//       withBorder
//       style={{
//         position: "relative",
//         width: "95%",
//       }}
//     >
//       <div ref={plotRef} style={{ width: "100%", height: "100%" }} />
//     </Paper>
//   );
// });

// export default function UplotComponent({
//   props: {x_data, y_data },
// }: GuiUplotMessage) {
//   // Add timing state
//   const lastUpdateTime = React.useRef<number>(Date.now());
//   const updateCount = React.useRef<number>(0);

//   // Validate data
//   if (!Array.isArray(x_data) || !Array.isArray(y_data)) {
//     console.error("Invalid data: x_data and y_data must be arrays");
//     return null;
//   }

//   if (x_data.length !== y_data.length) {
//     console.error("Invalid data: x_data and y_data must have the same number of trajectories");
//     return null;
//   }

//   if (x_data.length === 0) {
//     console.error("Invalid data: no trajectories provided");
//     return null;
//   }

//   // Validate each trajectory
//   for (let i = 0; i < x_data.length; i++) {
//     if (!Array.isArray(x_data[i]) || !Array.isArray(y_data[i])) {
//       console.error(`Invalid data: trajectory ${i} must be arrays`);
//       return null;
//     }
//     if (x_data[i].length !== y_data[i].length) {
//       console.error(`Invalid data: trajectory ${i} x and y data must have the same length`);
//       return null;
//     }
//     if (x_data[i].length === 0) {
//       console.error(`Invalid data: trajectory ${i} cannot be empty`);
//       return null;
//     }
//   }

//   const [opened, { open, close }] = useDisclosure(false);
//   const { ref, width } = useElementSize();
//   const modalRef = React.useRef<HTMLDivElement>(null);
//   const { width: modalWidth } = useElementSize({ ref: modalRef });
//   const plotRef = React.useRef<uPlot | null>(null);
//   const modalPlotRef = React.useRef<uPlot | null>(null);
//   const animationFrameRef = React.useRef<number>();
//   const lastDataRef = React.useRef<uPlot.AlignedData | null>(null);

//   // Log initial mount
//   React.useEffect(() => {
//     console.warn("UplotComponent mounted");
//     return () => {
//       console.warn("UplotComponent unmounted");
//       if (animationFrameRef.current) {
//         cancelAnimationFrame(animationFrameRef.current);
//       }
//     };
//   }, []);

//   React.useEffect(() => {
//     if (!plotRef.current) return;

//     const plot = plotRef.current;
//     const cursorIdx = plot.cursor.idx;

//     animationFrameRef.current = requestAnimationFrame(() => {
//       plot.setData([
//         new Float64Array(x_data[0]),
//         ...y_data.map(y => new Float64Array(y))
//       ]);

//       if (cursorIdx != null && cursorIdx >= 0) {
//         plot.setCursor({ idx: cursorIdx });
//       }
//     });

//     return () => {
//       if (animationFrameRef.current) {
//         cancelAnimationFrame(animationFrameRef.current);
//       }
//     };
//   }, [x_data, y_data]);

//   // Update plot data when props change
//   // React.useEffect(() => {
//   //   const now = Date.now();
//   //   const timeSinceLastUpdate = now - lastUpdateTime.current;
//   //   updateCount.current += 1;

//   //   lastUpdateTime.current = now;

//   //   // Create data array with x data and all y data series
//   //   const newData: uPlot.AlignedData = [
//   //     new Float32Array(x_data[0]), // Use first trajectory's x data as x-axis
//   //     ...y_data.map(y => new Float32Array(y))
//   //   ];

//   //   lastDataRef.current = newData;

//   //   // Only update if enough time has passed since last update
//   //   const MIN_UPDATE_INTERVAL = 100; // Minimum time between updates in ms
//   //   if (timeSinceLastUpdate < MIN_UPDATE_INTERVAL) {
//   //     return;
//   //   }




//     // function update() {
//     //   if (plotRef.current && lastDataRef.current) {
//     //     try {
//     //       // Store current cursor state
//     //       const cursor = plotRef.current.cursor;
//     //       const cursorLeft = cursor.left ?? -10;
//     //       const cursorTop = cursor.top ?? -10;
//     //       const cursorIdx = plotRef.current.cursor.idx;
//     //       const hasValidCursor = cursorIdx != null && cursorIdx >= 0;


//     //       console.log("[UplotComponent] SAVE Cursor state:", { cursorLeft, cursorTop });

//     //       // Update data
//     //       plotRef.current.setData(lastDataRef.current);

//     //       // // Restore cursor state - only position, not idx
//     //       // plotRef.current.setCursor({
//     //       //   left: cursorLeft,
//     //       //   top: cursorTop
//     //       // });
//     //       // plotRef.current.cursor.move();

//     //       if (hasValidCursor) {
//     //         const plot = plotRef.current;
//     //         const rect = plot.root.getBoundingClientRect();

//     //         const simulatedX = rect.left + cursorLeft;
//     //         const simulatedY = rect.top + cursorTop;

//     //         const evt = new MouseEvent("mousemove", {
//     //           clientX: simulatedX,
//     //           clientY: simulatedY,
//     //           bubbles: true,
//     //         });

//     //         plot.root.dispatchEvent(evt);
//     //       }

//     //       console.log("[UplotComponent] RESTORE Cursor state:", { cursorLeft, cursorTop });

//     //     } catch (e) {
//     //       console.error("Error updating main plot:", e);
//     //     }
//     //   }
//     //   if (modalPlotRef.current && lastDataRef.current) {
//     //     try {
//     //       // Store current cursor state
//     //       const cursor = modalPlotRef.current.cursor;
//     //       const cursorLeft = cursor.left ?? -10;
//     //       const cursorTop = cursor.top ?? -10;

//     //       // Update data
//     //       modalPlotRef.current.setData(lastDataRef.current);

//     //       // Restore cursor state - only position, not idx
//     //       modalPlotRef.current.setCursor({
//     //         left: cursorLeft,
//     //         top: cursorTop
//     //       });
//     //       modalPlotRef.current.cursor.move();
//     //     } catch (e) {
//     //       console.error("Error updating modal plot:", e);
//     //     }
//     //   }
//     // }

//   //   // Use requestAnimationFrame for smoother updates
//   //   animationFrameRef.current = requestAnimationFrame(update);

//   //   // Cleanup function
//   //   return () => {
//   //     if (animationFrameRef.current) {
//   //       cancelAnimationFrame(animationFrameRef.current);
//   //     }
//   //   };
//   // }, [x_data, y_data]);

//   const options: uPlot.Options = {
//     width: width || 400,
//     height: (width || 400) * 0.6,
//     scales: {
//       x: {
//         time: false,
//         range: (u: uPlot, min: number, max: number): [number, number] => [min, max],
//       },
//       y: {
//         range: (u: uPlot, min: number, max: number): [number, number] => [min, max],
//       },
//     },
//     axes: [{}],
//     series: [
//       {}, // x-axis
//       ...x_data.map((_, i) => ({
//         stroke: ['blue', 'red', 'green', 'purple', 'orange', 'brown', 'pink', 'gray'][i % 8],
//         width: 2,
//         label: `Trajectory ${i + 1}`,
//       })),
//     ],
//     cursor: {
//       show: true,
//       points: {
//         show: true,
//         size: 5,
//       },
//       drag: {
//         setScale: true,
//       },
//     },
//     hooks: {
//       setCursor: [
//         (u) => {
//           // This hook is called when the cursor position changes
//           // We can use it to ensure the cursor state is maintained
//           return () => {
//             // Cleanup function
//           };
//         }
//       ]
//     }
//   };

//   // Use a fixed width for the modal plot initially, then update when the modal is opened
//   const modal_options: uPlot.Options = {
//     ...options,
//     width: opened ? (modalWidth || 650) : 650,
//     height: opened ? ((modalWidth || 650) * 0.6) : 650 * 0.6,
//   };

//   const initialData: uPlot.AlignedData = [
//     new Float32Array(x_data[0]), // Use first trajectory's x data as x-axis
//     ...y_data.map(y => new Float32Array(y))
//   ];

//   return (
//     <Box>
//       {/* Draw static plot in the controlpanel, which can be clicked. */}
//       <Tooltip.Floating zIndex={100} label={"Click to expand"}>
//         <Box
//           style={{
//             cursor: "pointer",
//             flexShrink: 0,
//             position: "relative",
//           }}
//           onClick={open}
//         >
//           <Paper
//             ref={ref}
//             className={folderWrapper}
//             withBorder
//             style={{ position: "relative" }}
//           >
//             <UplotReact
//               options={options}
//               data={initialData}
//               onCreate={(chart) => {
//                 plotRef.current = chart;
//               }}
//               onDelete={(chart) => {
//                 if (plotRef.current === chart) {
//                   plotRef.current = null;
//                 }
//               }}
//             />
//           </Paper>
//         </Box>
//       </Tooltip.Floating>

//       {/* Modal contents. keepMounted makes state changes (eg zoom) to the plot persistent. */}
//       <Modal opened={opened} onClose={close} size="xl" keepMounted>
//         <Paper
//           ref={modalRef}
//           className={folderWrapper}
//           withBorder
//           style={{ position: "relative" }}
//         >
//           <UplotReact
//             options={modal_options}
//             data={initialData}
//             onCreate={(chart) => {
//               modalPlotRef.current = chart;
//             }}
//             onDelete={(chart) => {
//               if (modalPlotRef.current === chart) {
//                 modalPlotRef.current = null;
//               }
//             }}
//           />
//         </Paper>
//       </Modal>
//     </Box>
//   );
// }


// import React from "react";
// import uPlot from "uplot";
// import UplotReact from "uplot-react";
// import "uplot/dist/uPlot.min.css";

// import { Modal, Box, Paper, Tooltip } from "@mantine/core";
// import { useDisclosure, useElementSize } from "@mantine/hooks";
// import { GuiUplotMessage } from "../WebsocketMessages";
// import { folderWrapper } from "./Folder.css";

// export default function UplotComponent({
//   props: { x_data, y_data },
// }: GuiUplotMessage) {
//   const [opened, { open, close }] = useDisclosure(false);
//   const { ref: containerRef, width: containerWidth } = useElementSize();
//   const modalRef = React.useRef<HTMLDivElement>(null);
//   const { width: modalWidth } = useElementSize({ ref: modalRef });

//   const plotRef = React.useRef<uPlot | null>(null);
//   const modalPlotRef = React.useRef<uPlot | null>(null);
//   const animationFrameRef = React.useRef<number>();

//   const x = new Float64Array(x_data[0]);
//   const y = y_data.map((traj) => new Float64Array(traj));
//   const alignedData: uPlot.AlignedData = [x, ...y];

//   // Store cursor index
//   const lastCursorIdx = React.useRef<number | null>(null);

//   // Update function that runs via requestAnimationFrame
//   React.useEffect(() => {
//     const updatePlot = (plotRef: React.MutableRefObject<uPlot | null>) => {
//       const plot = plotRef.current;
//       if (!plot) return;

//       lastCursorIdx.current = plot.cursor.idx ?? null;
//       plot.setData(alignedData);

//       if (lastCursorIdx.current != null) {
//         plot.setCursor({ idx: lastCursorIdx.current });
//       }
//     };

//     animationFrameRef.current = requestAnimationFrame(() => {
//       updatePlot(plotRef);
//       updatePlot(modalPlotRef);
//     });

//     return () => {
//       if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
//     };
//   }, [x_data, y_data]);

//   const sharedOptions = (w: number): uPlot.Options => ({
//     width: w,
//     height: w * 0.6,
//     scales: {
//       x: {
//         time: false,
//         range: (u, min, max) => [min, max],
//       },
//       y: {
//         range: (u, min, max) => [min, max],
//       },
//     },
//     axes: [{}],
//     series: [
//       {},
//       ...y_data.map((_, i) => ({
//         label: `Trajectory ${i + 1}`,
//         stroke: ["red", "green", "blue", "orange", "purple"][i % 5],
//         width: 2,
//       })),
//     ],
//     cursor: {
//       show: true,
//       drag: { setScale: true },
//       points: { show: true, size: 4 },
//     },
//   });

//   return (
//     <Box>
//       <Tooltip.Floating label="Click to expand" zIndex={100}>
//         <Box onClick={open} style={{ cursor: "pointer", flexShrink: 0 }}>
//           <Paper
//             ref={containerRef}
//             className={folderWrapper}
//             withBorder
//             style={{ position: "relative" }}
//           >
//             {containerWidth > 0 && (
//               <UplotReact
//                 options={sharedOptions(containerWidth)}
//                 data={alignedData}
//                 onCreate={(chart) => (plotRef.current = chart)}
//                 onDelete={(chart) => {
//                   if (plotRef.current === chart) plotRef.current = null;
//                 }}
//               />
//             )}
//           </Paper>
//         </Box>
//       </Tooltip.Floating>

//       <Modal opened={opened} onClose={close} size="xl" keepMounted>
//         <Paper
//           ref={modalRef}
//           className={folderWrapper}
//           withBorder
//           style={{ position: "relative" }}
//         >
//           {modalWidth > 0 && (
//             <UplotReact
//               options={sharedOptions(modalWidth)}
//               data={alignedData}
//               onCreate={(chart) => (modalPlotRef.current = chart)}
//               onDelete={(chart) => {
//                 if (modalPlotRef.current === chart) modalPlotRef.current = null;
//               }}
//             />
//           )}
//         </Paper>
//       </Modal>
//     </Box>
//   );
// }



import React, { useEffect, useState, useRef, useMemo } from "react";
import uPlot from "uplot";
import UplotReact from "uplot-react";
import "uplot/dist/uPlot.min.css";

import { Modal, Box, Paper, Tooltip } from "@mantine/core";
import { useDisclosure, useElementSize } from "@mantine/hooks";
import { GuiUplotMessage } from "../WebsocketMessages";
import { folderWrapper } from "./Folder.css";

export default function UplotComponent({
  props: { x_data, y_data },
}: GuiUplotMessage) {
  const [opened, { open, close }] = useDisclosure(false);
  const { ref: containerRef, width: containerWidth } = useElementSize();
  const modalRef = useRef<HTMLDivElement>(null);
  const { width: modalWidth } = useElementSize({ ref: modalRef });

  // Stable key so React doesn't recreate plot unnecessarily
  const plotKey = "main-plot";
  const modalPlotKey = "modal-plot";

  // Convert inputs to Float64Array once per update
  const alignedData = useMemo<uPlot.AlignedData>(() => {
    const x = new Float64Array(x_data[0]);
    const y = y_data.map((traj) => new Float64Array(traj));
    return [x, ...y];
  }, [x_data, y_data]);

  // Data state managed by React
  const [data, setData] = useState<uPlot.AlignedData>(alignedData);

  // Update data state when inputs change
  useEffect(() => {
    setData(alignedData);
  }, [alignedData]);

  // Store cursor index to restore after data update
  const lastCursorIdx = useRef<number | null>(null);

  // Store refs to uPlot instances
  const plotRef = useRef<uPlot | null>(null);
  const modalPlotRef = useRef<uPlot | null>(null);

  // When data updates, restore cursor position on the plot instances
  useEffect(() => {
    [plotRef.current, modalPlotRef.current].forEach((plot) => {
      if (!plot) return;
      // Save last cursor index if available
      if (plot.cursor.idx != null) lastCursorIdx.current = plot.cursor.idx;
      // No direct plot.setData here — React updates data prop to uPlotReact which calls setData internally
      // Just restore cursor position
      if (lastCursorIdx.current != null) {
        plot.setCursor({ idx: lastCursorIdx.current });
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
      ...y_data.map((_, i) => ({
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
    sharedOptions(containerWidth)
  );
  const [modalOptions, setModalOptions] = useState<uPlot.Options>(() =>
    sharedOptions(modalWidth)
  );

  // Update options on container/modal resize
  useEffect(() => {
    setMainOptions(sharedOptions(containerWidth));
  }, [containerWidth]);

  useEffect(() => {
    setModalOptions(sharedOptions(modalWidth));
  }, [modalWidth]);

  return (
    <Box>
      <Tooltip.Floating label="Click to expand" zIndex={100}>
        <Box onClick={open} style={{ cursor: "pointer", flexShrink: 0 }}>
          <Paper
            ref={containerRef}
            className={folderWrapper}
            withBorder
            style={{ position: "relative" }}
          >
            {containerWidth > 0 && (
              <UplotReact
                key={plotKey}
                options={mainOptions}
                data={data}
                onCreate={(chart) => (plotRef.current = chart)}
                onDelete={(chart) => {
                  if (plotRef.current === chart) plotRef.current = null;
                }}
              />
            )}
          </Paper>
        </Box>
      </Tooltip.Floating>

      <Modal opened={opened} onClose={close} size="xl" keepMounted>
        <Paper
          ref={modalRef}
          className={folderWrapper}
          withBorder
          style={{ position: "relative" }}
        >
          {modalWidth > 0 && (
            <UplotReact
              key={modalPlotKey}
              options={modalOptions}
              data={data}
              onCreate={(chart) => (modalPlotRef.current = chart)}
              onDelete={(chart) => {
                if (modalPlotRef.current === chart) modalPlotRef.current = null;
              }}
            />
          )}
        </Paper>
      </Modal>
    </Box>
  );
}
