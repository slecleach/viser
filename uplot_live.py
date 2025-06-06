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


# GuiUplotHandle
# GuiUplotMessage
# GuiUplotProps


def main() -> None:
    server = viser.ViserServer(port=8100)

    Nplots = 5
    time_step = 0.01
    Nhorizon = 100
    time_value = 0.0
    Nupdates = 5000
    frequency = 3

    handles = []
    for i in range(Nplots):
        x_data = time_value + time_step * np.arange(Nhorizon)
        y_data = np.sin(frequency * 2 * np.pi * x_data)

        t0 = time.time()
        print(f"Creating plot {i} with initial data:", x_data, y_data)
        uplot_handle = server.gui.add_uplot(
            x_data=[float(x) for x in x_data],
            y_data=[float(y) for y in y_data],
        )

        handles.append(uplot_handle)
        t1 = time.time()
        elapsed = t1 - t0
        print("[sending uplot message] elapsed", elapsed)

    for idx in range(Nupdates):
        new_x_data = time_value + time_step * np.arange(Nhorizon)
        new_y_data = np.concatenate((y_data[1:], np.sin(frequency * 2 * np.pi * new_x_data[-1:])))
        for handle in handles:
            handle.x_data = [float(x) for x in new_x_data]
            handle.y_data = [float(y) for y in new_y_data]
        time.sleep(time_step)
        time_value += time_step
        x_data = new_x_data
        y_data = new_y_data

    input("Press Enter to continue...")


if __name__ == "__main__":
    main()
