# /// script
# requires-python = "==3.12"
# dependencies = [
#     "polars",
#     "pyarrow",
# ]
# ///
import io
import polars as pl
import numpy as np
import pyarrow.feather as feather
from datetime import datetime, timedelta
from decimal import Decimal

# Generate sample data
num_rows = 100
ids = range(num_rows)
names = [f"Person_{i}" for i in ids]
ages = np.random.randint(18, 80, num_rows)
heights = np.random.uniform(150, 200, num_rows)
is_student = np.random.choice([True, False], num_rows)

# Date (days since epoch)
dates = [datetime.now().date() - timedelta(days=i) for i in range(num_rows)]

# Datetime (milliseconds since epoch)
datetimes = [
    datetime.now() - timedelta(days=i, hours=np.random.randint(0, 24))
    for i in range(num_rows)
]

times = [datetime.now().time() for _ in range(num_rows)]
tuples = [np.random.randint(0, 100, 2) / 100 for _ in range(num_rows)]
addresses = [
    {"street": f"Street {i}", "city": f"City {i % 10}", "zip": str(10000 + i)}
    for i in range(num_rows)
]
hobbies = [
    np.random.choice(
        ["reading", "sports", "music", "travel", "cooking"],
        size=np.random.randint(1, 4),
    ).tolist()
    for _ in range(num_rows)
]
salaries = [
    Decimal(str(round(np.random.uniform(30000, 100000), 2))) for _ in range(num_rows)
]

# Generate durations (days until next birthday)
days_to_birthday = [timedelta(days=np.random.randint(1, 365)) for _ in range(num_rows)]

df = pl.DataFrame({
    "id": ids,
    "name": names,
    "age": ages,
    "height": heights,
    "is_student": is_student,
    "date": dates,
    "datetime": datetimes,
    "time": times,
    "address": addresses,
    "hobbies": hobbies,
    "tuples": tuples,
    "salary": salaries,
    "days_to_birthday": days_to_birthday,
})


table = df.to_arrow()

print(table.schema)

sink = io.BytesIO()
feather.write_feather(table, sink, compression="uncompressed")
data = sink.getbuffer()

with open("sample4.feather", "wb") as f:
    f.write(data)

