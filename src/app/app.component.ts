import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

// --- Interfaces ---
interface Trip {
  id: number;
  from: string;
  to: string;
  level: number; // 1 or 2
  isContinuation: boolean;
  color: string; // color for the path/label
  tripKey: string; // "FROM-TO" key
}

interface SvgNode {
  x: number;
  y: number;
  id: number;
  isStartNode: boolean;
  tripRef: Trip; // Trip ending here (or starting for node 0)
  stroke: string;
  fill: string;  
}

interface SvgPath {
  d: string; // SVG path data (using Cubic Bezier)
  stroke: string; // Path color 
  label: {
    text: string;
    x: number;
    y: number;
    color: string; 
  };
  tripRef: Trip;
}

interface SvgArrow {
  x: number; 
  y: number; 
  color: string; // Arrow color
}


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'transportSimple';

  trips: Trip[] = [];
  from = ''; 
  to = '';   

  // --- Visualization Parameters ---
  baseY = 100; 
  levelHeight = 50; 
  segmentWidth = 140; 
  startXOffset = 50; 
  nodeRadius = 6; 
  arrowSize = 10; 
  nodeFill = 'white'; 
  nodeStrokeWidth = 2;

  // --- Colors ---
  colorL1Start = '#673ab7';      // l1
  colorL1Mid = '#00bcd4';       // curve up
  colorL2Orange = '#f68b1f';        // l2
  colorL1TransitionDownGrey = '#9e9e9e'; //curve down 
  arrowColor = '#00bcd4';    //arrow

  nodeFillL1 = this.colorL1Mid;  

  // --- SVG elements ---
  svgPaths: SvgPath[] = [];
  svgNodes: SvgNode[] = [];
  svgArrows: SvgArrow[] = [];
  svgWidth = 800; 
  svgHeight = 200; 

  private tripCounter = 0;
  private tripHistory: { [key: string]: number } = {}; // Tracks count of "FROM-TO"

  addTrip(): void {
    const start = this.from.trim().toUpperCase().slice(0, 3);
    const end = this.to.trim().toUpperCase().slice(0, 3);
    if (!start || !end) return; //base condition

    this.tripCounter++;
    const currentKey = `${start}-${end}`; // key
    const lastTrip = this.trips.length > 0 ? this.trips[this.trips.length - 1] : null;
    const isContinuation = !!lastTrip && lastTrip.to === start; //check for same trip

    // Increment 
    this.tripHistory[currentKey] = (this.tripHistory[currentKey] || 0) + 1;
    const currentCount = this.tripHistory[currentKey];

    // L2 or L1
    let assignedLevel = 1; // Default to L1
    if (currentCount >= 2) {
      assignedLevel = 2;
    }

    let assignedColor = assignedLevel === 1 ? this.colorL1Mid : this.colorL2Orange;

    const newTrip: Trip = {
      id: this.tripCounter,
      from: start,
      to: end,
      level: assignedLevel,
      isContinuation,
      color: assignedColor, 
      tripKey: currentKey
    };
    this.trips.push(newTrip);

    // If L2 based on c == 2 then prev also on L2 
    if (assignedLevel === 2) {
      this.trips.forEach(trip => {
        if (trip.tripKey === currentKey) {
          trip.level = 2;
        }
      });
    }

    //set to default
    this.from = '';
    this.to = '';
    this.generateSvgElements();
  }


  private generateSvgElements(): void {
    // Reset arrays 
    this.svgNodes = [];
    this.svgPaths = [];
    this.svgArrows = [];
    if (this.trips.length === 0) {
        this.svgWidth = this.startXOffset * 2; // Minimal width
        this.svgHeight = this.baseY + 30; 
        return; // Exit if no trips
    }

    let currentX = this.startXOffset;

    // --- Step 1: Calculate Base Y Positions ---
    const nodeBaseYPositions: number[] = [];
    nodeBaseYPositions.push(this.getYForLevel(this.trips[0].level)); // Y for start point (Node 0)
    for (let i = 0; i < this.trips.length; i++) {
        nodeBaseYPositions.push(this.getYForLevel(this.trips[i].level)); // Y for end points (Node 1 to N)
    }

    // --- Step 2: Calculate FINAL Y Positions (CURVE) ---
    // Adjust Y positions to make L1 segments adjacent to L2 blocks curve
    const finalNodeYPositions = [...nodeBaseYPositions]; 
    for (let i = 0; i < this.trips.length; i++) {
        const currentTrip = this.trips[i];
        const nextTrip = i + 1 < this.trips.length ? this.trips[i + 1] : null;
        const prevTrip = i > 0 ? this.trips[i - 1] : null;

        // Curve Up Logic: If current=L1 and next=L2 => END (i+1) 
        if (currentTrip.level === 1 && nextTrip?.level === 2) {
            finalNodeYPositions[i + 1] = this.getYForLevel(2);
        }
        // Curve Down Logic: If current=L1 and previous=L2 => START  (i) 
        if (currentTrip.level === 1 && prevTrip?.level === 2) {
            finalNodeYPositions[i] = this.getYForLevel(2);
        }
        // Flat L2 Logic: If current=L2 => START (i) and END (i+1)
        if (currentTrip.level === 2) {
            finalNodeYPositions[i] = this.getYForLevel(2);
            finalNodeYPositions[i + 1] = this.getYForLevel(2);
        }
    }

    // --- Step 3: Create Node Objects ---
    currentX = this.startXOffset;
    // Create Node 0 (Start Point)
    let node0Color = this.trips[0].level === 1 ? this.colorL1Start : this.colorL2Orange;
    this.svgNodes.push({
        x: currentX, y: finalNodeYPositions[0], id: this.trips[0].id * 10,
        isStartNode: true, tripRef: this.trips[0],
        stroke: node0Color, // Color reflects the start
        fill: this.nodeFillL1
    });
    // Create Nodes 1 to N (End Points)
    for (let i = 0; i < this.trips.length; i++) {
        currentX += this.segmentWidth;
        this.svgNodes.push({
            x: currentX, y: finalNodeYPositions[i + 1], id: this.trips[i].id * 10 + 1,
            isStartNode: false, tripRef: this.trips[i],
            stroke: '', 
            fill: this.nodeFillL1
        });
    }

    // --- Step 4: Create Path, Arrow Objects & Finalize Node Colors ---
    for (let i = 0; i < this.trips.length; i++) {
        const trip = this.trips[i];
        const startNode = this.svgNodes[i]; // Use node object with final Y
        const endNode = this.svgNodes[i + 1]; // Use node object with final Y
        const prevTrip = i > 0 ? this.trips[i - 1] : null;

        // --- Determine Path Color based on segment type/context ---
        let pathColor: string;
        if (trip.level === 2) {
            pathColor = this.colorL2Orange; // L2 
        } else { // L1 
            if (startNode.y === this.getYForLevel(1) && endNode.y === this.getYForLevel(2)) {
                pathColor = this.colorL1Mid; // Curve Up L1
            } else if (startNode.y === this.getYForLevel(2) && endNode.y === this.getYForLevel(1)) {
                pathColor = this.colorL1TransitionDownGrey; // Curve Down L1 
            } else if (!prevTrip) {
                pathColor = this.colorL1Start; // First L1 
            } else {
                pathColor = this.colorL1Mid; // Flat L1 
            }
        }
        trip.color = pathColor;

        // Set the stroke color
        if (endNode) {
            endNode.stroke = pathColor;
        }

        if (i === 0) {
          startNode.stroke = pathColor;
       }

        // --- Check for Discontinuity Arrow ---
        if (trip.level === 1 && !trip.isContinuation && i > 0) {
            this.svgArrows.push({
                x: startNode.x - this.nodeRadius - 4, // Position before node
                y: startNode.y, // Align with node's final Y
                color: this.arrowColor, 
          });
        }

        // --- Generate Path 'd' attribute (Cubic Bezier) ---
        let pathD = `M ${startNode.x} ${startNode.y}`;
        if (Math.abs(startNode.y - endNode.y) < 0.1) { // Use tolerance for float comparison
            pathD += ` L ${endNode.x} ${endNode.y}`; // Straight line
        } else { // Curved line
            const factor = 0.5; // Controls curve intensity
            const ctrlP1X = startNode.x + this.segmentWidth * factor; const ctrlP1Y = startNode.y;
            const ctrlP2X = endNode.x - this.segmentWidth * factor; const ctrlP2Y = endNode.y;
            pathD += ` C ${ctrlP1X},${ctrlP1Y} ${ctrlP2X},${ctrlP2Y} ${endNode.x},${endNode.y}`; // Cubic Bezier command
        }

        // --- Calculate Label Position ---
        const labelX = startNode.x + this.segmentWidth / 2; // Center horizontally
        const labelYBase = (startNode.y + endNode.y) / 2; // Vertical midpoint
        const labelOffsetY = Math.abs(startNode.y - endNode.y) < 0.1 ? -20 : -28; // Higher offset for curves
        const labelY = labelYBase + labelOffsetY;

        // --- Create Path Object ---
        this.svgPaths.push({
            d: pathD,
            stroke: pathColor,
            label: { text: `${trip.from}-${trip.to}`, x: labelX, y: labelY, color: pathColor },
            tripRef: trip,
        });
    } // End loop creating paths/arrows

    for(let i = 0; i < this.svgNodes.length; i++) {
      const node = this.svgNodes[i];
      const endingTrip = i > 0 ? this.trips[i-1] : null; // Trip ending at i (null for node 0)
      const startingTrip = i < this.trips.length ? this.trips[i] : null; // Trip starting at i (null for last node)

      // If the trip ending here is L2 OR the trip starting here is L2
      const shouldBeTransparent = (endingTrip && endingTrip.level === 2) || (startingTrip && startingTrip.level === 2);

      if (shouldBeTransparent) {
          node.fill = this.nodeFill;
      } else {
          node.fill = this.nodeFillL1;
      }

       // Ensure stroke is set for Node 0 if it wasn't handled by path loop (only 1 trip case)
       if (i === 0 && !node.stroke) {
            node.stroke = this.trips[0].color; // Use the trip's final calculated color
       }
  }

    // --- Step 5: Adjust SVG Canvas Size ---
    this.svgWidth = this.startXOffset + this.trips.length * this.segmentWidth + this.startXOffset; // Dynamic width
    this.svgHeight = this.baseY + 30; // Fixed height allowing space above L2
  }

  private getYForLevel(level: number): number {
    return level === 1 ? this.baseY : this.baseY - this.levelHeight; // L2 above L1
  }

} 