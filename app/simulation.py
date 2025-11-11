import numpy as np
import tensorflow_probability.substrates.numpy as tfp

tfd = tfp.distributions

def parse_time(time_str):
    h, m = map(int, time_str.split(":"))
    return h + m / 60

class Archetype:
    def __init__(self, name, weight, params):
        self.name = name
        self.weight = weight
        self.params = params

    def sample(self):
        return {
            "name": self.name,
            "miles_per_year": self.params["miles_per_year"].sample().item(),
            "battery_kwh": self.params["battery_kwh"].sample().item(),
            "efficiency": self.params["efficiency"].sample().item(),
            "plug_in_freq": self.params["plug_in_freq"].sample().item(),
            "charger_kw": self.params["charger_kw"].sample().item(),
            "target_soc": self.params["target_soc"].sample().item(),
            "plug_in_soc": self.params["plug_in_soc"].sample().item(),
            "charging_duration_hrs": self.params["charging_duration_hrs"].sample().item(),
            "plug_in_time": self.params["plug_in_time"].sample().item(),
            "plug_out_time": self.params["plug_out_time"].sample().item(),
            "plug_in_duration": self.params["plug_in_duration"].sample().item(),
        }


def simulate_battery_vector(
    plug_in_freq,
    plug_in_time,
    charging_duration,
    plug_in_duration,
    plug_in_soc,
    target_soc,
    charger_kw,
    battery_kwh
):
    current_soc = plug_in_soc
    start_hour = int(plug_in_time % 24)

    battery = {}
    plugged = [0] * 24

    hour = start_hour
    for step in range(24):
        real_hour = hour % 24

        within_plug_window = step < plug_in_duration
        is_charging = within_plug_window and current_soc < target_soc

        if within_plug_window:
            plugged[real_hour] = 1

        if is_charging:
            delta = min(charger_kw / battery_kwh, target_soc - current_soc)
            current_soc = min(current_soc + delta, 1.0)
        elif within_plug_window:
            # Plugged in but not charging — idle
            current_soc = current_soc
        else:
            # Unplugged — simulate usage/discharging
            delta = 0.1
            current_soc = max(current_soc - delta, 0)

        battery[real_hour] = current_soc
        hour += 1

    soc_vector = [battery.get(h, 0.0) for h in range(24)]
    plug_vector = plugged

    return soc_vector, plug_vector


def simulate_one_agent(archetypes):
    archetype = np.random.choice(archetypes, p=[a.weight for a in archetypes])
    sample = archetype.sample()

    name = sample["name"]
    plug_in_freq = sample['plug_in_freq']
    plug_in_time = sample["plug_in_time"] % 24
    charging_duration_hrs = sample["charging_duration_hrs"]
    plug_in_duration = sample["plug_in_duration"]
    plug_in_soc = sample["plug_in_soc"]
    target_soc = sample["target_soc"]
    charger_kw = sample["charger_kw"]
    battery_kwh = sample["battery_kwh"]


    battery_vector, plug_vector = simulate_battery_vector(
        plug_in_freq,
        plug_in_time,
        charging_duration_hrs,
        plug_in_duration,
        plug_in_soc,
        target_soc,
        charger_kw,
        battery_kwh
    )
    return {
        "name":name,
        "plug_in_time":plug_in_time,
        "plug_out_time":(plug_in_time + plug_in_duration) % 24,
        "battery_vector":battery_vector,
        "plug_vector":plug_vector,
        "plug_in_soc":plug_in_soc
    }


# def simulate_agents(archetypes, n_agents):
#     archetype_choices = np.random.choice(
#         archetypes,
#         size=n_agents,
#         p=[a.weight for a in archetypes]
#     )
#
#     return [simulate_one_agent([a]) for a in archetype_choices]