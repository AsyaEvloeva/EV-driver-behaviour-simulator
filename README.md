# EV-driver-behaviour-simulator


This project is a simple simulator that models the behaviour of EV drivers. It focusses on

when people plug in their EV and what the battery's state of charge looks like during that

time. The simulator is designed to capture variation across different types of drivers by using

an agent-based approach.

## How it works

Each simulated EV driver (agent) is based on one of several archetypes, predefined behaviour

profiles that describe things like charging frequency, battery size, and when they typically

plug in.

The simulator uses random sampling to create realistic values for each agent. It models:

- When they plug in

- How long they're plugged in

- SoC when they start charging

- SoC per each hour while charging / not-charging

- How the battery charges over time

- When they unplug

- What happens to the battery when they're not plugged in

Everything is simulated on an hourly basis over a 24h day.

## Dependences and results

This gives a full picture of a single driver's charging behaviour over one day:

The simulation relies on:

- A class for archetypes, which defines behaviour using statistical distributions

- A function to simulate battery charging, which takes into account charging speed,

battery size, and SoC targets

- A function to simulate an agent, pulling from an archetype and generating hourly data

for SoC and plug-in status

The result for each agent is:

- A vector showing the battery charge for each hour of the day

- A vector showing whether the car was plugged in at each hour

- The time they plugged in and out

- Their SoC at plug-in

## Assumptions

These are reasonable defaults for a first mvp version:

To keep things simple, a few assumptions were made:

- The battery discharges at a constant rate when not plugged in

- Charging stops once the target SoC is reached

- The model currently simulates one day at a time

- Plug-in frequency is sampled but not yet used to skip charging on some days

- No driving behaviour modelled, the simulation does not currently account for actual

driving, trip schedules, mileage variations, or how usage patterns influence charging

needs.

## Idea

The goal was to focus on the core of the challenge: modelling realistic EV charging

behaviour at the individual level, while making it easy to scale up and analyse population-

level trends. The simulation is modular and easy to extend, whether you want to add more

detailed battery logic, connect it to a dashboard, or run longer simulations across multiple

days.

Some effort was spent making sure the sampling and battery modelling were clear and

realistic. A bit less time was spent on UI or packaging, since the main focus was the logic

behind the simulation.

## How to use it

You can run the simulator to generate many agents and then analyse:

- When people typically plug in

- How full their batteries are when they do

- What charging looks like across the day

This could feed into visualizations or dashboards to help better understand and manage EV

charging behaviour on a larger scale.

![Screenshot 2](https://github.com/AsyaEvloeva/EV-driver-behaviour-simulator/blob/main/simulator2.png)
![Screenshot 1](https://github.com/AsyaEvloeva/EV-driver-behaviour-simulator/blob/main/simulator1.png)
