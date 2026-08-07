import json
from collections import defaultdict

def keys_by_layer(obj, layer=0, layers=None):
    if layers is None:
        layers = defaultdict(set)
    if isinstance(obj, dict):
        for k, v in obj.items():
            layers[layer].add(k)
            keys_by_layer(v, layer + 1, layers)
    elif isinstance(obj, list):
        for item in obj:
            keys_by_layer(item, layer, layers)
    return layers

with open(".venv\Mined courses.json", encoding="utf-8") as f:
    data = json.load(f)

layers = keys_by_layer(data)
for depth in sorted(layers):
    print(f"Layer {depth}: {sorted(layers[depth])}")
