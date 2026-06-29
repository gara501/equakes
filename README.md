# Equakes

Equakes is a React + TypeScript + Vite project focused on earthquake awareness, preparedness, and education.

The app combines a real-time 3D globe with recent seismic activity, a comparative seismic scale view, a personalized emergency backpack generator, and a quick decision simulator designed to help users think about earthquake response before an actual event happens.

## Motivation

Most earthquake dashboards stop at showing dots on a map. This project was built to go further:

- turn live seismic data into a more spatial and intuitive 3D experience
- connect hazard visualization with practical preparedness tools
- explain earthquake magnitude in a way that feels immediate, not abstract
- give users simple training surfaces they can interact with on desktop and mobile

The goal is not only to display earthquake activity, but to help people understand risk, context, and readiness.

## Main Features

- **3D Earthquake Globe**
  - Renders Earth with Three.js through React Three Fiber
  - Plots recent earthquakes from the USGS daily feed
  - Scales and colors markers by magnitude
  - Supports selection, focus, and earthquake detail views
  - Includes geolocation-based nearest-earthquake feedback

- **Seismic Scale Page**
  - Shows a comparative 3D seismic magnitude visualization
  - Uses animated sphere growth, cracking lines, glow, and postprocessing
  - Helps explain the logarithmic nature of earthquake magnitude

- **Backpack Page**
  - Builds a personalized emergency backpack checklist
  - Adapts quantities based on adults, children, seniors, and pets
  - Persists progress in `localStorage`

- **Simulator Page**
  - Runs a short timed decision-making quiz
  - Provides immediate feedback for each scenario
  - Focuses on realistic earthquake safety choices

## APIs and External Data

### 1. USGS Earthquake Feed

Source:
`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`

Used for:
- recent earthquake positions
- magnitude values
- depth
- timestamps
- place labels
- event URLs

This is the main live data source that powers the globe experience.

### 2. Browser Geolocation API

Used for:
- locating the current user
- estimating the nearest recent earthquake relative to the user position

This is a browser-native API, not a third-party service.

### 3. localStorage

Used for:
- saving emergency backpack checklist progress
- restoring the backpack setup after reload

This is also browser-native and keeps the preparedness workflow lightweight.

## Tech Stack

- React 19
- TypeScript
- Vite
- Three.js
- React Three Fiber
- React Three Drei
- React Three Postprocessing
- Oxlint

## Project Structure

High-level structure:

```text
src/
  components/
    Earth/
      hooks/
      utils/
      EarthCanvas.tsx
      EarthMarkers.tsx
      EarthModel.tsx
      EarthSequences.tsx
      EarthUI.tsx
    recommendations/
      BackpackBuilder.tsx
      BackpackPage.tsx
      DecisionSimulator.tsx
      SimulatorPage.tsx
      recommendationsData.ts
      backpackUtils.ts
    seismic/
      scene/
      hooks/
      SeismicScalePage.tsx
  constants/
  utils/
```

The app is split into focused areas:

- `Earth/` handles live seismic visualization and related UI
- `seismic/` handles the seismic scale educational page
- `recommendations/` handles preparedness tools and interactive learning

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

## Notes

- The project uses lazy-loaded pages for the educational and preparedness sections to reduce the initial bundle cost.
- Three.js-related rendering is optimized for interactive use, but the Earth texture still has a noticeable bundle weight.
- Styling is implemented with plain CSS, not a component styling framework.

## Future Directions

Potential next steps for the project:

- further split large 3D-related bundles
- add broader historical earthquake filters
- improve accessibility around simulations and controls
- add more preparedness modules beyond backpack and quiz flows

## License

This project currently has no explicit license file in the repository.
