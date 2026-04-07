# /// script
# requires-python = ">=3.11"
# dependencies = ["pyarrow>=18.0.0"]
# ///
"""Generate IPC fixtures with Arrow types unsupported by apache-arrow JS."""

import pathlib
import pyarrow as pa

out = pathlib.Path(__file__).parent

table = pa.table({
    "large_list": pa.array([[1, 2, 3], [4, 5]], type=pa.large_list(pa.int32())),
    "list_view": pa.array([[1, 2], [3, 4]], type=pa.list_view(pa.int32())),
    "large_list_view": pa.array([[10, 20], [30, 40]], type=pa.large_list_view(pa.int32())),
    "binary_view": pa.array([b"\x01\x02", b"\x03\x04"], type=pa.binary_view()),
    "utf8_view": pa.array(["hello", "world"], type=pa.string_view()),
})

path = out / "unsupported_types.arrow"
with pa.ipc.new_stream(str(path), table.schema) as writer:
    writer.write_table(table)
print(f"wrote {path.name}: {table.schema}")
