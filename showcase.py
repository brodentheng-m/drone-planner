from codrone_edu.drone import *
import time
import threading

drone1 = Drone()
drone2 = Drone()
drone3 = Drone()

drone1.pair()
drone2.pair()
drone3.pair()

time.sleep(2)

speed = 50
distance = 100
turn_angle = 90
safe_distance = 30
battery_threshold = 20
loop_count = 0
total_distance = 0
x = 0
y = 0
z = 0
i = 0
temp = 0.0
elapsed = 0.0
dist = 0
height = 0
color = "none"
battery = 100
user_choice = 0

speed = speed + 10
distance = distance * 2
turn_angle = turn_angle / 2
total_distance = total_distance + distance
x = x + 1
y = y - 1
z = z * 2

print(speed)
print(distance)
print(turn_angle)
print(total_distance)
print(x)
print(y)
print(z)

flight_log = [10, 20, 30, 40, 50]
colors_list = ["red", "green", "blue", "yellow", "cyan"]
distances_read = []
headings_flown = []

flight_log.append(60)
flight_log.append(70)
colors_list.append("magenta")
colors_list.append("white")

val = flight_log[0]
print(val)
val = flight_log[3]
print(val)
val = colors_list[1]
print(val)
val = colors_list[4]
print(val)

t = time.time()
mission_start = time.time()

def fly_drone1():
    d = drone1
    d.takeoff()
    time.sleep(2)

    d.set_led("green")
    d.set_buzzer(440, 0.3)
    time.sleep(1)

    d.move_forward(50, 60)
    time.sleep(0.5)

    d.move_backward(50, 60)
    time.sleep(0.5)

    d.move_left(30, 50)
    time.sleep(0.5)

    d.move_right(30, 50)
    time.sleep(0.5)

    d.turn_left(90)
    time.sleep(0.5)

    d.turn_right(90)
    time.sleep(0.5)

    d.go("forward", 40, 1.0)
    time.sleep(0.3)
    d.go("backward", 40, 1.0)
    time.sleep(0.3)
    d.go("left", 40, 1.0)
    time.sleep(0.3)
    d.go("right", 40, 1.0)
    time.sleep(0.3)

    d.set_led("red")
    time.sleep(0.5)
    d.set_led("green")
    time.sleep(0.5)
    d.set_led("blue")
    time.sleep(0.5)
    d.set_led("yellow")
    time.sleep(0.5)
    d.set_led("cyan")
    time.sleep(0.5)
    d.set_led("magenta")
    time.sleep(0.5)
    d.set_led("white")
    time.sleep(0.5)

    d.random_color()
    time.sleep(0.5)
    d.random_color()
    time.sleep(0.5)

    d.set_buzzer(262, 0.3)
    time.sleep(0.4)
    d.set_buzzer(330, 0.3)
    time.sleep(0.4)
    d.set_buzzer(392, 0.3)
    time.sleep(0.4)
    d.set_buzzer(523, 0.5)
    time.sleep(0.6)

    dist = d.get_distance()
    print(dist)
    distances_read.append(dist)

    height = d.get_height()
    print(height)

    color = d.get_color()
    print(color)

    battery = d.get_battery()
    print(battery)

    temp = d.get_temperature()
    print(temp)

    for i in range(5):
        d.move_forward(20, 30)
        time.sleep(0.3)

    for i in range(0, 10, 2):
        d.turn_left(15)
        time.sleep(0.2)

    for i in range(10, 0, -1):
        d.move_forward(i * 5, 40)
        time.sleep(0.2)

    loop_count = 0
    while loop_count < 10:
        d.hover(0.5)
        loop_count = loop_count + 1

    dist = d.get_distance()
    while dist > safe_distance:
        d.move_forward(20, 40)
        time.sleep(0.3)
        dist = d.get_distance()
        print(dist)

    battery = d.get_battery()
    if battery > 50:
        d.set_led("green")
        d.move_forward(100, 60)
        time.sleep(1)
    elif battery > 30:
        d.set_led("yellow")
        d.move_forward(50, 40)
        time.sleep(0.5)
    else:
        d.set_led("red")
        d.land()
        time.sleep(2)

    color = d.get_color()
    if color == "red":
        d.set_led("red")
        d.set_buzzer(800, 0.3)
        d.hover(1)
    elif color == "green":
        d.set_led("green")
        d.set_buzzer(400, 0.3)
        d.move_forward(50, 50)
    elif color == "blue":
        d.set_led("blue")
        d.set_buzzer(600, 0.3)
        d.turn_left(90)
    else:
        d.set_led("white")
        d.hover(0.5)

    d.set_led("green")
    d.set_buzzer(440, 0.2)

    d.move_forward(50, 60)
    time.sleep(0.5)
    d.turn_right(90)
    time.sleep(0.3)
    d.move_forward(50, 60)
    time.sleep(0.5)
    d.turn_right(90)
    time.sleep(0.3)
    d.move_forward(50, 60)
    time.sleep(0.5)
    d.turn_right(90)
    time.sleep(0.3)

    d.set_led("blue")
    time.sleep(0.3)
    d.set_led("cyan")
    time.sleep(0.3)
    d.set_led("white")
    time.sleep(0.3)

    d.set_buzzer(523, 0.3)
    time.sleep(0.5)

    d.flip("back")
    time.sleep(1)

    d.set_led("green")
    d.set_buzzer(880, 0.3)

    elapsed = time.time() - mission_start
    print(elapsed)

    d.set_led("red")
    d.set_buzzer(200, 0.5)
    time.sleep(1)

    d.set_led("off")
    d.land()

def fly_drone2():
    d = drone2
    d.takeoff()
    time.sleep(2)

    d.set_led("blue")
    d.set_buzzer(523, 0.3)
    time.sleep(1)

    d.circle()
    time.sleep(3)

    d.square()
    time.sleep(3)

    d.triangle()
    time.sleep(3)

    d.set_led("magenta")
    time.sleep(0.3)
    d.set_led("purple")
    time.sleep(0.3)
    d.set_led("pink")
    time.sleep(0.3)

    d.set_buzzer(330, 0.2)
    d.turn_left(45)
    time.sleep(0.3)
    d.set_buzzer(440, 0.2)
    d.move_forward(40, 50)
    time.sleep(0.3)
    d.set_buzzer(550, 0.2)
    d.turn_right(90)
    time.sleep(0.3)
    d.set_buzzer(660, 0.3)
    d.move_backward(40, 50)
    time.sleep(0.3)
    d.set_buzzer(880, 0.3)
    d.hover(0.5)

    for i in range(3):
        d.move_forward(30, 50)
        time.sleep(0.3)
        d.turn_right(120)
        time.sleep(0.3)

    d.set_led("orange")
    time.sleep(0.5)
    d.set_led("yellow")
    time.sleep(0.5)
    d.set_led("green")
    time.sleep(0.5)

    battery = d.get_battery()
    while battery > battery_threshold:
        d.move_forward(15, 30)
        time.sleep(0.3)
        d.turn_left(30)
        time.sleep(0.2)
        battery = d.get_battery()
        elapsed = time.time() - mission_start
        print(elapsed)

    d.set_led("cyan")
    d.set_buzzer(1000, 0.2)
    time.sleep(0.5)

    d.flip("forward")
    time.sleep(1)
    d.flip("left")
    time.sleep(1)
    d.flip("right")
    time.sleep(1)

    for i in range(5):
        d.move_forward(20, 40)
        time.sleep(0.2)
        d.turn_right(72)
        time.sleep(0.2)

    d.set_led("white")
    time.sleep(0.3)

    height = d.get_height()
    while height < 1.5:
        d.move_forward(10, 30)
        time.sleep(0.2)
        height = d.get_height()
        print(height)

    while height > 1.0:
        d.move_backward(10, 30)
        time.sleep(0.2)
        height = d.get_height()
        print(height)

    d.set_led("red")
    d.set_buzzer(200, 0.5)
    time.sleep(1)

    d.set_led("off")
    d.land()

def fly_drone3():
    d = drone3
    d.takeoff()
    time.sleep(2)

    d.set_led("orange")
    d.set_buzzer(660, 0.3)
    time.sleep(1)

    for i in range(4):
        d.move_forward(40, 50)
        time.sleep(0.3)
        d.turn_right(90)
        time.sleep(0.3)

    d.set_led("pink")
    time.sleep(0.5)

    d.move_left(60, 50)
    time.sleep(0.5)
    d.move_right(60, 50)
    time.sleep(0.5)

    d.go("left", 40, 1.0)
    time.sleep(0.3)
    d.go("right", 40, 1.0)
    time.sleep(0.3)

    dist = d.get_distance()
    print(dist)

    if dist < 20:
        d.set_led("red")
        d.move_backward(30, 50)
    elif dist < 50:
        d.set_led("yellow")
        d.hover(0.5)
    else:
        d.set_led("green")
        d.move_forward(50, 50)

    height = d.get_height()
    if height > 1.5:
        d.set_led("cyan")
        d.move_backward(20, 40)
    elif height < 0.5:
        d.set_led("orange")
        d.move_forward(20, 40)
    else:
        d.set_led("green")

    temp = d.get_temperature()
    if temp > 30:
        d.set_led("red")
        d.set_buzzer(1000, 0.5)
    elif temp > 20:
        d.set_led("green")
    else:
        d.set_led("blue")

    battery = d.get_battery()
    dist = d.get_distance()
    height = d.get_height()

    if battery > 60:
        if dist > 50:
            d.set_led("green")
            d.move_forward(80, 60)
        elif dist > 20:
            d.set_led("yellow")
            d.move_forward(40, 40)
        else:
            d.set_led("red")
            d.turn_left(90)
    elif battery > 30:
        if height > 1.0:
            d.set_led("orange")
            d.hover(1)
        else:
            d.set_led("yellow")
            d.move_forward(30, 30)
    else:
        d.set_led("red")
        d.set_buzzer(200, 1.0)
        d.land()

    d.set_led("purple")
    time.sleep(0.3)

    for i in range(8):
        d.set_led("red")
        time.sleep(0.15)
        d.set_led("orange")
        time.sleep(0.15)
        d.set_led("yellow")
        time.sleep(0.15)
        d.set_led("green")
        time.sleep(0.15)
        d.set_led("cyan")
        time.sleep(0.15)
        d.set_led("blue")
        time.sleep(0.15)
        d.set_led("purple")
        time.sleep(0.15)
        d.set_led("magenta")
        time.sleep(0.15)

    d.set_buzzer(262, 0.2)
    d.move_forward(20, 40)
    time.sleep(0.3)
    d.set_buzzer(330, 0.2)
    d.turn_right(45)
    time.sleep(0.3)
    d.set_buzzer(392, 0.2)
    d.move_forward(20, 40)
    time.sleep(0.3)
    d.set_buzzer(523, 0.3)
    d.turn_left(90)
    time.sleep(0.4)
    d.set_buzzer(659, 0.2)
    d.move_backward(20, 40)
    time.sleep(0.3)
    d.set_buzzer(784, 0.3)
    d.hover(0.5)

    battery = d.get_battery()
    flight_log2 = []

    for row in range(3):
        for col in range(3):
            d.move_forward(30, 40)
            time.sleep(0.3)
            dist = d.get_distance()
            flight_log2.append(dist)
            height = d.get_height()
            flight_log2.append(height)
        d.turn_right(90)
        time.sleep(0.3)
        d.move_forward(30, 40)
        time.sleep(0.3)
        d.turn_left(90)
        time.sleep(0.3)

    d.set_led("red")
    d.set_buzzer(200, 0.5)
    time.sleep(1)

    d.set_led("off")
    d.land()

def scan_area(d):
    d.turn_left(90)
    time.sleep(0.5)
    dist = d.get_distance()
    print(dist)
    d.turn_right(90)
    time.sleep(0.5)

def pattern_square(d):
    for i in range(4):
        d.move_forward(40, 50)
        time.sleep(0.3)
        d.turn_right(90)
        time.sleep(0.3)

def pattern_triangle(d):
    for i in range(3):
        d.move_forward(50, 50)
        time.sleep(0.3)
        d.turn_right(120)
        time.sleep(0.3)

def pattern_circle(d):
    d.circle()
    time.sleep(0.5)

def emergency_stop(d):
    d.set_led("red")
    d.set_buzzer(1000, 0.5)
    d.hover(0.5)
    d.land()

def led_chase(d):
    d.set_led("red")
    time.sleep(0.2)
    d.set_led("green")
    time.sleep(0.2)
    d.set_led("blue")
    time.sleep(0.2)
    d.set_led("yellow")
    time.sleep(0.2)

def take_reading(d):
    d2 = d.get_distance()
    h = d.get_height()
    c = d.get_color()
    b = d.get_battery()
    t = d.get_temperature()
    print(d2)
    print(h)
    print(c)
    print(b)
    print(t)

def get_altitude(d):
    h = d.get_height()
    return h

def check_battery(d):
    b = d.get_battery()
    return b

def is_safe(d):
    dist = d.get_distance()
    if dist > 30:
        return True
    else:
        return False

def calculate_speed(power):
    s = power * 2
    return s

alt = get_altitude(drone1)
print(alt)

pwr = check_battery(drone1)
print(pwr)

safe = is_safe(drone1)
print(safe)

spd = calculate_speed(50)
print(spd)

user_choice = input("Enter 1-5 for flight pattern: ")
print(user_choice)

scan_area(drone1)
time.sleep(0.5)

scan_area(drone2)
time.sleep(0.5)

scan_area(drone3)
time.sleep(0.5)

threads = []
t1 = threading.Thread(target=fly_drone1)
t2 = threading.Thread(target=fly_drone2)
t3 = threading.Thread(target=fly_drone3)
threads.append(t1)
threads.append(t2)
threads.append(t3)

for t in threads:
    t.start()
for t in threads:
    t.join()

drone1.close()
drone2.close()
drone3.close()
