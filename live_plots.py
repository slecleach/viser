"""Live Plotly Plots in Viser

Example of creating live-updating Plotly plots in Viser."""

import time

import numpy as np
import plotly.graph_objects as go

import viser
from viser._gui_handles import GuiPlotlyHandle, _make_uuid, _GuiHandleState, GuiPlotlyUpdateHandle
from viser import _messages
from pathlib import Path
from viser._gui_api import _apply_default_order

# GuiPlotlyUpdateMessage
# GuiPlotlyUpdateProps
# GuiPlotlyUpdateHandle


def create_wave_plot(t: float, wave_type: str = "sin") -> go.Figure:
    """Create a wave plot starting at time t."""
    x_data = np.linspace(t, t + 6 * np.pi, 50)
    if wave_type == "sin":
        y_data = np.sin(x_data) * 10
        title = "Sine Wave"
    else:
        y_data = np.cos(x_data) * 10
        title = "Cosine Wave"

    fig = go.Figure()
    fig.add_trace(
        go.Scatter(x=list(x_data), y=list(y_data), mode="lines", name=wave_type)
    )

    fig.update_layout(
        title=title,
        xaxis_title="x",
        yaxis_title=f"{wave_type}(x)",
        margin=dict(l=20, r=20, t=40, b=20),
        showlegend=False,
    )

    return fig


def main() -> None:
    server = viser.ViserServer()

    Nfull = 20
    Nupdate = 300
    time_step = 0.3

    # Create two plots
    time_value = 0.0
    sin_plot_handle = server.gui.add_plotly(figure=create_wave_plot(time_value, "sin"))
    cos_plot_handle = server.gui.add_plotly(figure=create_wave_plot(time_value, "cos"))

    # while True:
    for i in range(Nfull):
        print("i", i, "of", Nfull)
        sin_plot_handle.figure = create_wave_plot(time_value, "sin")
        cos_plot_handle.figure = create_wave_plot(time_value, "cos")

        time.sleep(time_step)
        time_value += time_step

    for i in range(Nupdate):
        sin_plot_update_handle = server.gui.update_plotly(
            handle=sin_plot_handle,
            new_x_data = time_value,
            new_y_data = -12.0 + np.sin(time_value),
        )
        time.sleep(time_step)
        time_value += time_step
        print("time_value", time_value)


    input("Press Enter to continue...")
    
    # while True:
    #     sin_plot_handle.visible = True
    #     cos_plot_handle.visible = False
    #     time.sleep(0.5)
    #     sin_plot_handle.visible = False
    #     cos_plot_handle.visible = True
    #     time.sleep(0.5)

    # # Update loop
    # while True:
    #     t0 = time.time()
    #     time_value += time_step
    #     # the setter for the handle is called here, this triggers the update of the json string
    #     # self._plotly_json_str = json_str
    #     sin_plot_handle.figure = create_wave_plot(time_value, "sin")
    #     cos_plot_handle.figure = create_wave_plot(time_value, "cos")

    #     elapsed = time.time() - t0
    #     time.sleep(max(0.0, time_step - elapsed))
    #     print(f"Time step: {time_step}, elapsed: {elapsed}")


if __name__ == "__main__":
    main()
