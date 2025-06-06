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
    server = viser.ViserServer()

    Nupdate = 5
    time_step = 1.1
    Nchunk = 10
    time_value = 0.0

    handles = []
    for i in range(Nupdate):
        x_data = time_value + time_step * np.arange(Nchunk) / Nchunk
        y_data = 10 * np.sin(5 * x_data)
        x_data = [float(x) for x in x_data]
        y_data = [float(y) for y in y_data]

        t0 = time.time()
        print(f"Creating plot {i} with initial data:", x_data, y_data)
        uplot_handle = server.gui.add_uplot(
            x_data=x_data,
            y_data=y_data,
        )

        for j in range(50):
            print(f"Update {j}:", x_data, [1.0 + 0.2 * j for y in y_data])
            uplot_handle.x_data = x_data
            uplot_handle.y_data = [1.0 + 0.2 * j for y in y_data]
            time.sleep(0.02)

        handles.append(uplot_handle)
        t1 = time.time()
        elapsed = t1 - t0
        print("[sending uplot message] elapsed", elapsed)
        time.sleep(time_step)
        time_value += time_step

    input("Press Enter to continue...")


if __name__ == "__main__":
    main()
