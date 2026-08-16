# Educational Drone API Reference

## 📋 Table of Contents
- [[#Drone Methods|Drone Methods]]
- [[#Movement Commands|Movement Commands]]
- [[#Rotation Commands|Rotation Commands]]
- [[#Pattern Commands|Pattern Commands]]
- [[#Flip Commands|Flip Commands]]
- [[#LED Control|LED Control]]
- [[#Buzzer Control|Buzzer Control]]
- [[#Sensor Methods|Sensor Methods]]
- [[#Utility Methods|Utility Methods]]
- [[#Control Flow|Control Flow]]

---

## 🚁 Drone Methods

### Connection & Setup

```python
from drone import *

drone = Drone()              # Create drone instance
drone.pair()                # Connect to drone
drone.close()               # Disconnect from drone
```

---

## 🎯 Movement Commands

### Basic Movement

```python
# Takeoff and Land
drone.takeoff()             # Take off to default height
drone.land()                # Land safely

# Forward/Backward/Left/Right
drone.move_forward(50, speed=60)   # Move forward 50cm at 60% power
drone.move_backward(50, speed=60)  # Move backward 50cm at 60% power
drone.move_left(30, speed=50)      # Move left 30cm at 50% power
drone.move_right(30, speed=50)     # Move right 30cm at 50% power
```

### Advanced Movement

```python
# Go command - supports all 6 directions
drone.go("forward", power=50, duration=1.0)   # Move forward at 50% power for 1 second
drone.go("backward", power=50, duration=1.0)  # Move backward
drone.go("left", power=50, duration=1.0)      # Move left
drone.go("right", power=50, duration=1.0)     # Move right
drone.go("up", power=50, duration=1.0)        # Move up
drone.go("down", power=50, duration=1.0)      # Move down
```

---

## 🔄 Rotation Commands

### Basic Turns

```python
drone.turn_left(90)      # Turn left 90 degrees
drone.turn_right(90)     # Turn right 90 degrees
```

### Advanced Turns

```python
# Turn with timeout and P-value
drone.turn_degree(
    degrees=90,        # Angle to turn
    timeout=3,         # Maximum time (seconds)
    p_value=10         # Proportional gain
)
```

---

## 🎨 Pattern Commands

### Circle Patterns

```python
# Circle without turning
drone.circle(
    speed=75,           # Speed percentage (10-100)
    direction=1        # 1 = clockwise, -1 = counter-clockwise
)

# Circle with turning
drone.circle_turn(
    speed=75,
    direction=1
)
```

### Square Patterns

```python
# Square without turning
drone.square(
    speed=60,           # Speed percentage
    seconds=1,          # Time per side (seconds)
    direction=1         # 1 = clockwise, -1 = counter-clockwise
)

# Square with turning
drone.square_turn(
    speed=60,
    seconds=1,
    direction=1
)
```

### Triangle Patterns

```python
# Triangle without turning
drone.triangle(
    speed=60,
    seconds=1,
    direction=1
)

# Triangle with turning
drone.triangle_turn(
    speed=60,
    seconds=1,
    direction=1
)
```

---

## 🤸 Flip Commands

```python
drone.flip("forward")   # Flip forward
drone.flip("back")      # Flip backward
drone.flip("left")      # Flip left
drone.flip("right")     # Flip right
```

---

## 💡 LED Control

### Set LED Color

```python
# Available colors
drone.set_led("red")
drone.set_led("green")
drone.set_led("blue")
drone.set_led("yellow")
drone.set_led("cyan")
drone.set_led("magenta")
drone.set_led("white")
drone.set_led("purple")
drone.set_led("orange")
drone.set_led("pink")
drone.set_led("off")      # Turn LED off
```

### Random LED

```python
drone.random_color()    # Cycle through random colors
```

---

## 🔊 Buzzer Control

```python
drone.set_buzzer(
    frequency=440,    # Frequency in Hz
    duration=0.5      # Duration in seconds
)
```

**Common Frequencies:**
- 262 Hz - C4
- 330 Hz - E4
- 392 Hz - G4
- 440 Hz - A4
- 523 Hz - C5
- 660 Hz - E5
- 880 Hz - A5

---

## 📡 Sensor Methods

### Distance Sensor

```python
distance = drone.get_distance()    # Returns distance in cm
print(distance)
```

### Height Sensor

```python
height = drone.get_height()         # Returns height in cm
print(height)
```

### Battery Level

```python
battery = drone.get_battery()        # Returns battery percentage
print(battery)
```

### Color Sensor

```python
color = drone.get_color()            # Returns color name
print(color)
# Possible values: "red", "green", "blue", "yellow", "cyan", "magenta", "white", "none"
```

### Temperature Sensor

```python
temperature = drone.get_temperature(unit="C")  # Returns temperature
temperature = drone.get_temperature(unit="F")  # in Celsius or Fahrenheit
print(temperature)
```

---

## 🛠️ Utility Methods

### Hover

```python
drone.hover(duration=1.0)    # Hover in place for specified seconds
```

### Emergency Stop

```python
drone.emergency_stop()    # Immediately stop all motors
```

### Stop Motors

```python
drone.stop_motors()       # Stop motors (drone will fall)
```

---

## 🔄 Control Flow

### If/Elif/Else Statements

```python
if condition:
    # Code to execute if condition is True
    drone.set_led("green")
elif other_condition:
    # Code to execute if other_condition is True
    drone.set_led("yellow")
else:
    # Code to execute if all conditions are False
    drone.set_led("red")
```

### While Loops

```python
while condition:
    # Code to execute while condition is True
    drone.move_forward(10, 50)
    time.sleep(0.3)
```

### For Loops

```python
# Range loop
for i in range(5):
    drone.move_forward(20, 50)
    time.sleep(0.3)

# Range with step
for i in range(0, 10, 2):
    drone.turn_left(15)
    time.sleep(0.2)

# Countdown
for i in range(10, 0, -1):
    drone.move_forward(i * 5, 40)
    time.sleep(0.2)
```

### Functions

```python
# Define function
def my_function(drone):
    drone.set_led("blue")
    drone.move_forward(50, 50)
    drone.turn_right(90)

# Call function
my_function(drone)
```

---

## 📊 Variables & Lists

### Variables

```python
# Declaration
my_var = 10

# Operations
my_var = my_var + 5    # Addition
my_var = my_var - 3    # Subtraction
my_var = my_var * 2    # Multiplication
my_var = my_var / 2    # Division
```

### Lists

```python
# Create list
my_list = [1, 2, 3, 4, 5]

# Append to list
my_list.append(6)

# Access list item
item = my_list[0]    # First item
item = my_list[2]    # Third item
```

---

## 🎯 Constants Reference

### LED Colors
| Color | String Value |
|-------|--------------|
| Red | `"red"` |
| Green | `"green"` |
| Blue | `"blue"` |
| Yellow | `"yellow"` |
| Cyan | `"cyan"` |
| Magenta | `"magenta"` |
| White | `"white"` |
| Purple | `"purple"` |
| Orange | `"orange"` |
| Pink | `"pink"` |
| Off | `"off"` |

### Directions (for go command)
| Direction | String Value |
|-----------|--------------|
| Forward | `"forward"` |
| Backward | `"backward"` |
| Left | `"left"` |
| Right | `"right"` |
| Up | `"up"` |
| Down | `"down"` |

### Flip Directions
| Direction | String Value |
|-----------|--------------|
| Forward | `"forward"` |
| Back | `"back"` |
| Left | `"left"` |
| Right | `"right"` |

### Pattern Directions
| Direction | Value |
|-----------|-------|
| Clockwise | `1` |
| Counter-Clockwise | `-1` |

---

## 📝 Notes

- All distances are in **centimeters (cm)**
- All speeds/powers are **percentages (0-100)**
- All angles are in **degrees**
- All durations are in **seconds**
- Always include `time.sleep()` between commands for smooth operation

## Tags

#api #reference #drone #documentation
