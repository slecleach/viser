"""Live Plotly Plots in Viser

Example of creating live-updating Plotly plots in Viser."""

import time
import numpy as np
import plotly.graph_objects as go
import viser

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
    fig.add_trace(go.Scatter(
        x=list(x_data),
        y=list(y_data),
        mode='lines',
        name=wave_type
    ))
    
    fig.update_layout(
        title=title,
        xaxis_title="x",
        yaxis_title=f"{wave_type}(x)",
        margin=dict(l=20, r=20, t=40, b=20),
        showlegend=False
    )
    
    return fig

def main() -> None:
    server = viser.ViserServer()
    
    # Create two plots
    time_value = 0.0
    sin_plot = server.gui.add_plotly(figure=create_wave_plot(time_value, "sin"))
    cos_plot = server.gui.add_plotly(figure=create_wave_plot(time_value, "cos"))
    
    # Update loop
    while True:
        time_value += 0.1
        sin_plot.figure = create_wave_plot(time_value, "sin")
        cos_plot.figure = create_wave_plot(time_value, "cos")
        time.sleep(0.1)  # Update every 100ms

if __name__ == "__main__":
    main() 