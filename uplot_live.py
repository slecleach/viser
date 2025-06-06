"""Live uplot Plots in Viser

Example of creating live-updating uplot plots in Viser."""

import time

import numpy as np

import viser

# handle the modal plot DONE
# handle the main plot reanchoring
# handle multiple trajectories
# handles number of elements in history DONE
# handle boundary ylims, xlims
# rename functions


# plot multiple traj per plot DONE
# check the effective refresh rate on the browser side DONE
# make sure you're only updating a single plot by changing the x_data for one handle DONE
# remove useless prints DONE

# make sure you can enlarge the plot
# make sure you can scroll down to lower plots DONE
# make sure you can hover over the plot
# remove legend and fix appearance
# pass options from python to the plot 
# cursor focus https://leeoniya.github.io/uPlot/demos/focus-cursor.html
# create an alignedData class to ship the data with only one handle update



# GuiUplotHandle
# GuiUplotMessage
# GuiUplotProps


def main() -> None:
    server = viser.ViserServer(port=8100)

    Ntrajs = 4
    Nplots = 20
    time_step = 0.001
    Nhorizon = 40
    time_value = 0.0
    Nupdates = int(20 / time_step)
    frequency = 3

    handles = []
    for i in range(Nplots):
        x_data = time_value + time_step * np.arange(Nhorizon)
        x_data = np.tile(x_data, (Ntrajs, 1))
        y_data = np.sin(frequency * 2 * np.pi * x_data) + np.random.randn(Ntrajs, Nhorizon) * 0.5

        t0 = time.time()
        print(f"Creating plot {i} with initial data:", x_data, y_data)
        uplot_handle = server.gui.add_uplot(
            x_data=[[float(x) for x in x_data[i]] for i in range(Ntrajs)],
            y_data=[[float(y) for y in y_data[i]] for i in range(Ntrajs)],
        )

        handles.append(uplot_handle)
        t1 = time.time()
        elapsed = t1 - t0
        print("[sending uplot message] elapsed", elapsed)

    for idx in range(Nupdates):
        new_x_data = time_value + time_step * np.arange(Nhorizon)
        new_x_data = np.tile(new_x_data, (Ntrajs, 1))
        new_y = np.sin(frequency * 2 * np.pi * new_x_data[:, -1:] + np.random.randn(Ntrajs, 1) * 0.5)
        new_y_data = np.concatenate((y_data[:, 1:], new_y), axis=-1)

        for handle in handles[0:]:
            handle.x_data = [[float(x) for x in new_x_data[i]] for i in range(Ntrajs)]
            handle.y_data = [[float(y) for y in new_y_data[i]] for i in range(Ntrajs)]
        time.sleep(time_step)
        time_value += time_step
        x_data = new_x_data
        y_data = new_y_data

    input("Press Enter to continue...")


if __name__ == "__main__":
    main()
