import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

# Parameters
D = 1.0  # Diffusion coefficient (cm^2/s)
L = 10.0  # Length of the tissue (cm)
T = 5.0  # Total time (s)
Nx = 100  # Number of spatial points
Nt = 1000  # Number of time steps
dx = L / (Nx - 1)  # Spatial step size
dt = T / Nt  # Time step size

# Stability condition
if D * dt / dx**2 > 0.5:
    raise ValueError("Stability condition not met. Reduce dt or increase dx.")

# Initial concentration profile (e.g., a pulse at the surface)
C = np.zeros(Nx)
C[0] = 1.0  # Initial concentration at the surface

# Store concentration profiles for animation
concentration_profiles = []

# Time evolution
for n in range(Nt):
    C_new = C.copy()
    for i in range(1, Nx - 1):
        C_new[i] = C[i] + D * dt / dx**2 * (C[i + 1] - 2 * C[i] + C[i - 1])
    C = C_new
    concentration_profiles.append(C.copy())  # Store the concentration profile

# Set up the figure for animation
fig, ax = plt.subplots()
x = np.linspace(0, L, Nx)
line, = ax.plot(x, concentration_profiles[0], label='Concentration')
ax.set_xlabel('Depth in Tissue (cm)')
ax.set_ylabel('Drug Concentration')
ax.set_title('Drug Diffusion in Human Tissues')
ax.set_ylim(0, 1.1)
ax.legend()
ax.grid()

# Animation function
def update(frame):
    line.set_ydata(concentration_profiles[frame])  # Update the data for the line
    return line,

# Create the animation
ani = FuncAnimation(fig, update, frames=Nt, blit=True, interval=50)

# Show the animation
plt.show()