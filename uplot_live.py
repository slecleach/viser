"""Live uplot Plots in Viser

Example of creating live-updating uplot plots in Viser."""

import time
from copy import deepcopy

import numpy as np

import viser

# handle the modal plot DONE
# handle the main plot reanchoring DONE
# handle multiple trajectories DONE
# handles number of elements in history DONE
# handle boundary ylims, xlims
# rename functions DONE
# plot multiple traj per plot DONE
# check the effective refresh rate on the browser side DONE
# make sure you're only updating a single plot by changing the x_data for one handle DONE
# remove useless prints DONE
# make sure you can scroll down to lower plots DONE
# make sure you can enlarge the plot DONE
# make sure you can hover over the plot DONE


# remove legend and fix appearance [xlim, ylim, title, legend, line or area]
# pass options from python to the plot
# cursor focus https://leeoniya.github.io/uPlot/demos/focus-cursor.html
# create an alignedData class to ship the data with only one handle update
# remove _queue_update if possible
# remove the dirty install of uplot and uplot_react


# GuiUplotHandle
# GuiUplotMessage
# GuiUplotProps


def main() -> None:
    server = viser.ViserServer(port=8100)

    Ntrajs = 8
    Nplots = 15
    time_step = 0.01
    Nhorizon = 150
    time_value = 0.0
    Nupdates = int(20 / time_step)
    frequency = 3

    options = {
        "scales": {
            "x": {
                "time": False,
                "auto": True,
            },
            "y": {"range": [-1.2, 1.2]},
        },
        "axes": [{}],
        "series": [
            {},
            *[
                {
                    "label": f"Trajectory {i + 1}",
                    "stroke": ["red", "green", "blue", "orange", "purple"][i % 5],
                    "width": 2,
                }
                for i in range(Ntrajs)
            ],
        ],
    }

    handles = []
    for i in range(Nplots):
        x_data = time_value + time_step * np.arange(Nhorizon)
        x_data = np.tile(x_data, (Ntrajs, 1))
        y_data = np.sin(
            frequency * 2 * np.pi * x_data + np.random.randn(Ntrajs, Nhorizon) * 0.5
        )
        aligned_data = np.concatenate((x_data[0:1, :], y_data), axis=0)

        t0 = time.time()
        # print(f"Creating plot {i} with initial data:", x_data, y_data)
        uplot_handle = server.gui.add_uplot(
            aligned_data=[
                [float(e) for e in aligned_data[i]] for i in range(Ntrajs + 1)
            ],
            options=options,
        )

        handles.append(uplot_handle)
        t1 = time.time()
        elapsed = t1 - t0
        print("[sending uplot message] elapsed", elapsed)

    for idx in range(Nupdates):
        new_x_data = time_value + time_step * np.arange(Nhorizon)
        new_x_data = np.tile(new_x_data, (Ntrajs, 1))
        new_y = np.sin(
            frequency * 2 * np.pi * new_x_data[:, -1:]
            + np.random.randn(Ntrajs, 1) * 0.5
        )
        new_y_data = np.concatenate((y_data[:, 1:], new_y), axis=-1)
        aligned_data = np.concatenate((new_x_data[0:1, :], new_y_data), axis=0)

        for handle in handles[0:20]:
            list_aligned_data = [
                [float(y) for y in aligned_data[i]] for i in range(Ntrajs + 1)
            ]
            options = deepcopy(handle.options)
            # handle.set_data_and_options(list_aligned_data, options)
            handle.aligned_data = list_aligned_data
            # handle.options = options
        time.sleep(time_step)
        time_value += time_step
        x_data = new_x_data
        y_data = new_y_data

    input("Press Enter to continue...")


if __name__ == "__main__":
    main()


#   const getOptions = (w: number): uPlot.Options => ({
#     width: w,
#     height: w * aspectRatio,
#     cursor: {
#       show: true,
#       drag: { setScale: true },
#       points: { show: true, size: 4 },
#     },
#     scales: {
#       x: {
#         time: false,
#         range: (u, min, max) => [min - 0.02, max + 0.02],
#       },
#       y: { range: [-1.2, 1.2] },
#     },
#     axes: [{}],
#     series: [
#       {},
#       {label: "Trajectory 1", stroke: "red", width: 2},
#       {label: "Trajectory 2", stroke: "green", width: 2},
#       {label: "Trajectory 3", stroke: "blue", width: 2},
#       {label: "Trajectory 4", stroke: "orange", width: 2},
#       {label: "Trajectory 5", stroke: "orange", width: 2},
#       // ...data.slice(1).map((_, i) => ({
#       //   label: `Trajectory ${i + 1}`,
#       //   stroke: ["red", "green", "blue", "orange", "purple"][i % 5],
#       //   width: 2,
#       // })),
#     ],
#   });

# num_series = num_traj + 1 works perfectly
# num series = num traj works perfectly
# num series = num traj - 1 works # doesn't show the last traj
# no label works perfectly
# no width works perfectly
# empty nothing is shown
# need stroke to show something
