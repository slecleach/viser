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


GuiUplotHandle
GuiUplotMessage
GuiUplotProps


def main() -> None:
    server = viser.ViserServer()

    Nupdate = 100000
    time_step = 0.1
    Nchunk = 10
    time_value = 0.0

    for i in range(Nupdate):
        x_data = time_value + time_step * np.arange(Nchunk) / Nchunk
        y_data = 10 * np.sin(5 * x_data)

        t0 = time.time()
        server.gui.add_uplot(
            x_data=x_data,
            y_data=y_data,
        )
        t1 = time.time()
        elapsed = t1 - t0
        print("[sending uplot message] elapsed", elapsed)
        time.sleep(time_step)
        time_value += time_step

    input("Press Enter to continue...")


if __name__ == "__main__":
    main()
