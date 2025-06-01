"""Live Plotly Plots in Viser

Example of creating live-updating Plotly plots in Viser."""

import time

import numpy as np
import plotly.graph_objects as go

import viser

# handle the modal plot
# handle multiple trajectories
# handles number of elements in history DONE
# handle boundary ylims, xlims


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
        go.Scatter(
            x=list(x_data),
            y=list(y_data),
            mode="lines",
            line=dict(color="red", width=2),  # Thinner line
            fill="tozeroy",
            fillcolor="rgba(255, 0, 0, 0.2)",
            name=wave_type,
        )
    )
    fig.add_trace(
        go.Scatter(
            x=list(x_data),
            y=list(y_data),
            mode="lines",
            line=dict(color="blue", width=2),  # Thinner line
            fill="tozeroy",
            fillcolor="rgba(0, 0, 255, 0.2)",
            name=wave_type + "_2",
        )
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
    Nupdate = 300000
    time_step = 0.01

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
        t0 = time.time()
        server.gui.plotly_extend_traces(
            plotly_element_uuid=sin_plot_handle._impl.uuid,
            x_data=time_value,
            y_data=-12.0 + np.sin(time_value),
            history_length=20 + i % 20,
        )
        print("history_length", 150 + i % 150)
        t1 = time.time()
        elapsed = t1 - t0
        print("elapsed", elapsed)
        time.sleep(time_step)
        time_value += time_step
        # print("time_value", time_value)

    input("Press Enter to continue...")


if __name__ == "__main__":
    main()
