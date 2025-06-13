"""Live uplot Plots in Viser

Example of creating live-updating uplot plots in Viser."""

import time
from copy import deepcopy

import numpy as np

import viser

# investigate how to reduce the font size of the legend
# add aspect ratio in the handle 0.5H
# remove the dirty install of uplot and uplot_react
# clean up example  0.5H
# clean up the code 1H


# GuiUplotHandle
# GuiUplotMessage
# GuiUplotProps


def main() -> None:
    server = viser.ViserServer(port=8100)

    Ntrajs = 8
    Nplots = 30
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
        "legend": {"show": True},
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

    t_start = time.time()
    for idx in range(Nupdates):
        t0 = time.time()
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
            options["scales"]["y"]["range"] = [-1.2 - 0.001 * idx, 1.2 + 0.001 * idx]
            handle.update_plot(list_aligned_data, options, aspect=0.25 + 0.001 * idx)
            handle.aligned_data = list_aligned_data
            # handle.options = options
            # handle.aspect = 0.5 + 0.2 * np.sin(0.005 * idx)

        t1 = time.time()
        elapsed = t1 - t0
        print(
            "[updating plots] elapsed",
            np.around(elapsed, 4),
            "time",
            np.around(time.time() - t_start, 2),
        )
        time.sleep(max(0, time_step - elapsed))
        time_value += time_step
        x_data = new_x_data
        y_data = new_y_data

    input("Press Enter to continue...")


if __name__ == "__main__":
    main()
