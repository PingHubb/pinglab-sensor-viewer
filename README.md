# PingLab Sensor Viewer · Web

**[Open the sensor viewer](https://PingHubb.github.io/pinglab-sensor-viewer/)**

A browser port of the sensor-only PingLab Windows v0.2.2 viewer. Open a link,
connect a USB serial sensor, and explore its response without installing the EXE,
Python or ROS. This is a new web implementation, not a Windows executable running
inside a webpage.

## Use it

1. Open the website in **desktop Chrome or Edge**.
2. Plug in the serial/Arduino/ESP32 sensor controller. Close the Windows viewer,
   Arduino Serial Monitor and other software using its port.
3. Choose Auto baud and Auto grid, or your known settings. Click **Connect sensor**
   and select the correct device in the browser's permission dialog.
4. Keep the sensor untouched and click **Update Calibration**.
5. Explore the views and click a taxel to inspect its signal. Arrow keys move the
   selection; drag 3D views to rotate, Shift-drag to pan, wheel to zoom, R to reset.
6. Click **Record CSV**, then **Stop recording**. Download **both** the CSV and its
   companion metadata JSON before closing the tab.

**Try demo** provides clearly marked synthetic data without opening any USB port.
The Quick guide inside the app explains the controls.

## Features retained from v0.2.2

- Serial commands: `channelCheck`, `readRaw`, `readCal`, `updateCal`.
- Auto baud (115200 then 9600), plus explicit baud settings.
- Auto grid, 5×5, 8×10, 20×20 and custom grids up to 1,600 taxels.
- Column-major indexing: `index = column * rows + row`; row 0 is at the top.
- Optional trailing reference column removal, including the legacy 10×9 payload.
- Signed raw-minus-baseline, raw signal, baseline, and signed percentage.
  A zero baseline produces an undefined percentage, never a fabricated zero.
- Smooth Map, Smooth 3D, 3D Point Grid, 3D Surface, 3D Heatmap and 2D Heatmap.
- Jet magnitude, Jet ± and blue/orange palettes. Cubic interpolation affects
  display only. Numbers and recordings use measured taxel values.
- Rotation, zoom, pan, top/reset camera, shared selection and expanded plotter.
- Signal graph with a 2–120 second window, hover readout, freeze and expanded view.
  History retains 3,000 frames and clears after calibration.
- Stored baseline, a 20-frame median fallback, and calibration updates serialized
  with acquisition. Failed calibration retains the last valid baseline.
- CSV with all taxels' raw and signed differences, UTC timestamp, elapsed seconds,
  sequence and baseline version. JSON uses `pinglab_sensor_viewer_v1`, with shape,
  source, baseline history, frame count and stop reason.
- Disconnect after five consecutive missing frames; no silent reconnect to
  another device. Last readings remain visibly marked OFFLINE.

## Browser differences and limits

- **Live USB requires Web Serial and HTTPS (or localhost).** Desktop Chrome and
  Edge are the intended browsers. Firefox, Safari and most mobile browsers do
  not provide this connection path. A USB adapter may still need its OS driver.
- The browser shows its own device chooser and permitted ports rather than
  unrestricted Windows COM-port enumeration. Port metadata uses USB IDs where
  available; it may not expose the COM name.
- Recording is buffered in browser memory and stops at **32 MiB of CSV data**.
  Download both files, then start a new recording. Closing/reloading the tab
  loses undownloaded data; there is no background disk autosave.
- Keep the tab visible and the computer awake. Browser throttling/sleep can reduce
  acquisition rate. This is not a hard real-time logger. `dropped_frames` is zero
  for frames delivered by this serialized reader, not an estimate of samples the
  firmware never sent. Time gaps are visible in UTC/elapsed time.
- Expanded viewers are in-page dialogs. Canvas rendering and the synthetic demo's
  noise differ from Qt; the regular grid and signal calculations are preserved.
- The website must be loaded over the network. It has no offline installation or
  service-worker cache. Once loaded, sensor data is processed locally.
- Height is a signal visualization, not measured displacement or force.
- As with the EXE, direct Goodix USB/HID, robots, Bluetooth robot connections,
  firmware flashing, custom research meshes and masks are not included.

## Privacy and hosting

This is a static HTML/CSS/JavaScript app. There is no sensor-data server, analytics,
external script CDN or account requirement for visitors. Sensor readings stay in
the browser and downloaded files. GitHub serves the application files; normal
website access metadata is subject to GitHub's hosting policies.

GitHub Pages is configured to publish the `main` branch, repository root. The
`.nojekyll` file makes this a plain static website. No build step or npm packages
are required.

## Development

```sh
python3 -m http.server 8765 --bind 127.0.0.1
# Open http://127.0.0.1:8765 in a browser.
node --test tests/*.test.js
```

Node 20+ is used only for tests. Browsers run the native ES modules directly.

- `src/core.js`: grid, signals, colours, interpolation and recording.
- `src/serial.js`: Web Serial lifecycle, complete-line/frame parsing and timeouts.
- `src/session.js`: connection, baseline, acquisition and calibration sequencing.
- `src/plots.js`: interactive canvas plots.
- `src/app.js`: controls, session state and local downloads.

## Verification

19 automated checks pass, including fragmented serial input, malformed frames,
slow-baud deadlines, cancellation while opening, disconnection, auto-baud fallback,
calibration failure, baseline median, CSV metadata and signed calculations.
Browser demo checks cover plot modes, shared selection, recording, calibration,
graph freezing, and actual CSV/JSON downloads. A downloaded 1,217-frame demo
recording was checked for all 25 taxels and both baseline versions.

**Real USB sensor behavior and equivalence on your Windows hardware still require
an end-to-end test.** Compare a known corner, untouched baseline, signed response,
calibration and a short recording against Windows v0.2.2 before relying on it.

The protocol and numerical behavior were ported from the source included in
`PingLab-Sensor-Viewer-Windows-x64-3D-v0.2.2.zip`. The Python/Qt runtime and Windows
binaries are not bundled in this repository.
