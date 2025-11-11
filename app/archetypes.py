import pandas as pd
import numpy as np
import tensorflow_probability.substrates.numpy as tfp
from .simulation import Archetype
from datetime import datetime
tfd = tfp.distributions

def beta_from_mean(mean: float, strength: float = 10):
    """
    Beta distribution centered around a given mean
    """
    mean = float(mean)
    mean = max(0.001, min(0.999, mean))
    alpha = mean * strength
    beta = (1 - mean) * strength
    return tfd.Beta(concentration1=alpha, concentration0=beta)


def get_all_archetypes(csv_path="app/Archetypes.csv"):
    df = pd.read_csv(csv_path)
    df["Plug-in time"] = pd.to_datetime(df["Plug-in time"], format="%I:%M %p")
    df["Plug-out time"] = pd.to_datetime(df["Plug-out time"], format="%I:%M %p")

    df["Plug-in time"] = df["Plug-in time"].dt.hour + df["Plug-in time"].dt.minute / 60
    df["Plug-out time"] = df["Plug-out time"].dt.hour + df["Plug-out time"].dt.minute / 60
    # handle overnight durations
    df["Plug-in duration"] = (df["Plug-out time"] - df["Plug-in time"]) % 24

    print(df)

    archetypes = []
    for _, row in df.iterrows():
        archetypes.append(Archetype(
            name=row["Name"],
            weight=row["% of population"] / 100,
            params={
                "miles_per_year": tfd.LogNormal(loc=np.log(row["Miles/yr"]), scale=0.1),
                "battery_kwh": tfd.LogNormal(loc=np.log(row["Battery (kWh)"]), scale=0.05),
                "efficiency": tfd.LogNormal(loc=np.log(row["Efficiency (mi/kWh)"]), scale=0.05),
                "plug_in_freq": beta_from_mean(row["Plug-in frequency (per day)"]),
                "charger_kw": tfd.Deterministic(row["Charger kW"]),
                "target_soc": tfd.Beta(8, 2),
                "plug_in_soc": tfd.LogNormal(loc=np.log(float(str(row["Plug-in SoC"]).strip('%')) / 100), scale=0.05),
                "charging_duration_hrs": tfd.Normal(row["Charging duration (hrs)"], scale=0.2),
                "plug_in_time": tfd.LogNormal(loc=np.log(max(row["Plug-in time"], 0.1)), scale=0.2),
                "plug_out_time": tfd.LogNormal(loc=np.log(row["Plug-out time"]), scale=0.1),
                "plug_in_duration": tfd.LogNormal(loc=np.log(row["Plug-in duration"]), scale=0.1)
            }
        ))

    return archetypes
