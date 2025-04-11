# Angular Trip Sequence Visualizer (v17)

This project is an Angular 17 application designed to visualize a sequence of trips based on specific rules for continuity, repetition, and level changes. It dynamically generates an SVG graphic representing the journey.

![image](https://github.com/user-attachments/assets/3f3b6c32-88b8-4307-93b3-6f5851b427f9)

**Check out the live demo:** [**Live Demo Link**](https://transportsimpleg.netlify.app/)


## Description

The application allows users to input trip segments (Start Point and End Point). It then renders these trips as a connected sequence in an SVG, applying distinct visual styles and layouts based on the relationship between consecutive trips:

*   **Continuity:** Connected trips (e.g., A -> B, then B -> C) are shown as a continuous line. Disconnected trips (e.g., A -> B, then D -> E) are marked with an arrow indicating the break.
*   **Repetition (Level 2):** When a specific trip (e.g., HYD -> DEL) appears for the second time or more in the sequence, all instances of that trip are moved to a higher visual level (Level 2).
*   **Level Transitions (Curves):**
    *   The Level 1 segment immediately *before* the first Level 2 segment curves upwards to meet Level 2.
    *   The Level 1 segment immediately *after* the last Level 2 segment curves downwards from Level 2.
    *   Segments within the Level 2 sequence remain straight at the higher level.
*   **Styling:** Segments and nodes are color-coded based on their level and position (e.g., start, middle, transition). Nodes have different fill styles (filled for flat Level 1, outlined/transparent for Level 2 and transitions).
*   **Dynamic Adjustment:** The visualization container allows horizontal scrolling (`overflow-x: auto`) to accommodate any number of added trips while maintaining the defined page layout dimensions.

## Features

*   Input fields for Start and End points of a trip.
*   Takes first 3 characters of input for display (e.g., "Bangalore" -> "BLR").
*   Adds trips sequentially to the visualization.
*   Visualizes trips using SVG paths and circles.
*   **Level 1:** Default level for unique, non-repeating trips.
    *   **Continuity:** Smooth connection between nodes if `tripN.to === tripN+1.from`.
    *   **Discontinuity:** Arrow indicator shown before `tripN+1` if `tripN.to !== tripN+1.from`.
    *   **Color Coding:** Purple (Start), Blue (Middle/Curve Up), Grey (Curve Down).
    *   **Node Fill:** Filled nodes for flat segments, outlined for transition curves.
*   **Level 2:** Higher level for repeated trip segments.
    *   Triggered when a `FROM-TO` pair appears for the second time. *All* instances of that pair move to Level 2.
    *   **Appearance:** Straight lines at the higher level.
    *   **Color Coding:** Orange.
    *   **Node Fill:** Outlined nodes.
*   **Curves:** Uses Cubic Bezier curves for smooth level transitions.
*   **Node Styling:** Outlined circles with stroke color matching the path segment ending at the node.
*   **Responsiveness:** Handles an arbitrary number of trips via horizontal scrolling within its container.
*   **Visual Gaps:** Includes small visual spacing between lines/arrows and node circumferences.

## Tech Stack

*   **Angular:** v17+
*   **TypeScript:** For application logic.
*   **SCSS:** For styling the component and container.
*   **SVG:** For rendering the visualization dynamically.

## Prerequisites

*   Node.js (Version compatible with Angular 17, typically v18.13.0 or higher)
*   npm (Node Package Manager) or yarn

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Gnaneshwari28/transportSimple.git
    cd transportSimple
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Running the Application

1.  **Start the development server:**
    ```bash
    ng serve -o
    ```
    This command builds the application, starts a development server, and automatically opens it in your default browser (usually at `http://localhost:4200/`).

2.  **Use the Application:**
    *   Enter a start point (e.g., "BLR") and an end point (e.g., "MAA") in the input fields.
    *   Click the "Add Trip" button.
    *   Observe the visualization update below the form.
    *   Add more trips to see the sequence grow and the rules applied.

## Code Overview

*   **`src/app/app.component.ts`:** Contains the main logic for managing trips, calculating SVG element properties, and handling user input.
    *   `trips`: Array storing the sequence of `Trip` objects.
    *   `addTrip()`: Adds a new trip, determines its level, and triggers `generateSvgElements()`.
    *   `generateSvgElements()`: The core function that calculates node positions (including Y-adjustments for curves), path definitions (`d` attribute using Cubic Beziers), arrow positions, colors, and node styles based on the rules. It populates `svgNodes`, `svgPaths`, and `svgArrows`.
    *   Interfaces (`Trip`, `SvgNode`, `SvgPath`, `SvgArrow`): Define the data structures used.
*   **`src/app/app.component.html`:** The template file using Angular directives (`*ngFor`, `[attr.*]`) to bind the calculated SVG data (`svgNodes`, `svgPaths`, `svgArrows`) to SVG elements (`<circle>`, `<path>`, `<text>`).
*   **`src/app/app.component.scss`:** Contains styles for the input form, the visualizer container (including `overflow-x: auto`), and basic SVG text styling.


## License
]
This project is currently unlicensed / licensed under the [MIT License](LICENSE.txt). 
