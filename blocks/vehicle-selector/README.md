# Vehicle Selector Block

Renders a persistent vehicle bar and modal dialog allowing shoppers to identify their vehicle for accessory compatibility filtering.

## Features

- **Persistent bar** — always-visible strip showing selected vehicle with a "Change Vehicle" link
- **Modal dialog** with two input modes:
  - **VIN tab** — 17-character VIN input with live API look-up (500ms debounce)
  - **Year / Make / Model / Trim tab** — cascading selects populated from the data-platform API
- Persists selection to `sessionStorage['xcom:vehicle']`
- Dispatches `vehicle:changed` CustomEvent on `document` and `events.emit('vehicle:changed')` via the drop-in event bus
- Mobile-responsive: dialog renders as a bottom sheet on small screens

## Exports

| Export | Description |
|--------|-------------|
| `default decorate(block)` | Block decorator — call via EDS block loading |
| `getVehicle()` | Returns current vehicle from sessionStorage or `null` |
| `setVehicle(vehicle)` | Persists vehicle, fires `vehicle:changed` event |

## SessionStorage Key

`xcom:vehicle` — JSON object:
```json
{
  "vin": "optional",
  "year": "2024",
  "make": "Toyota",
  "model": "Camry",
  "trim": "XSE",
  "label": "2024 Toyota Camry XSE"
}
```

## Events

| Event | Payload | When |
|-------|---------|------|
| `vehicle:changed` (DOM CustomEvent + event-bus) | `vehicle` object or `null` | On save or clear |

## API Dependencies

Requires `data-platform-url` in Commerce config. Expected endpoints:
- `GET /vehicles/years` → `string[]`
- `GET /vehicles/makes?year=` → `string[]`
- `GET /vehicles/models?year=&make=` → `string[]`
- `GET /vehicles/trims?year=&make=&model=` → `string[]`
- `GET /vehicles/vin/:vin` → `{ year, make, model, trim }`

## Content Model

No authored content needed — block renders dynamically. Author the block as an empty table:

| Vehicle Selector |
|-----------------|
|                  |

## Requirements Covered

- Req 5.3: Refine search by Vehicle (PLP)
- Req 6.5: Verify Vehicle for Accessories Compatibility (PDP)
