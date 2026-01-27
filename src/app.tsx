import { useState } from "preact/hooks";
import "./app.css";
import { Forma } from "forma-embedded-view-sdk/auto";
import type { TerrainPadInput } from "forma-embedded-view-sdk/terrain";

// Type definitions based on the terrain API
type Position = { x: number; y: number; z: number };
type Bbox = { min: Position; max: Position };

// Generate a random 13-character alphanumeric ID
function generateRandomId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 13; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate a random rectangular pad within the terrain bounds
function generateRandomPad(bbox: Bbox): TerrainPadInput {
  // Calculate terrain dimensions with some margin to keep pads inside
  const margin = 0.1; // 10% margin from edges
  const xRange = bbox.max.x - bbox.min.x;
  const yRange = bbox.max.y - bbox.min.y;
  const zRange = bbox.max.z - bbox.min.z;

  // Random center point within bounds (with margin)
  const centerX = bbox.min.x + xRange * margin + Math.random() * xRange * (1 - 2 * margin);
  const centerY = bbox.min.y + yRange * margin + Math.random() * yRange * (1 - 2 * margin);

  // Random size: 10-50 meters (clamped to fit within terrain)
  const maxSize = Math.min(xRange, yRange) * 0.2; // Max 20% of terrain size
  const size = Math.max(10, Math.min(50, maxSize * (0.2 + Math.random() * 0.8)));
  const halfSize = size / 2;

  // Random elevation within terrain z range
  const elevation = bbox.min.z + Math.random() * zRange;

  // Random slope percentage: integer between 20 and 200
  const slopePercentage = Math.floor(10 + Math.random() * 100);

  return {
    id: generateRandomId(),
    coordinates: [
      { x: centerX - halfSize, y: centerY - halfSize },
      { x: centerX + halfSize, y: centerY - halfSize },
      { x: centerX + halfSize, y: centerY + halfSize },
      { x: centerX - halfSize, y: centerY + halfSize },
    ],
    elevation,
    slopePercentage,
    applyGrade: true,
  };
}

export function App() {
  const [status, setStatus] = useState<string>("");
  const [padCount, setPadCount] = useState<number | null>(null);

  // Create a single random pad and add it to existing pads
  const handleCreatePad = async () => {
    try {
      setStatus("Getting terrain bounds...");
      const bbox = await Forma.terrain.getBbox();
      
      setStatus("Generating random pad...");
      const pad = generateRandomPad(bbox);
      
      setStatus("Adding pad...");
      await Forma.terrain.addPads([pad]);
      
      // Update pad count
      const pads = await Forma.terrain.getPads();
      setPadCount(pads.length);
      
      setStatus(`Created pad "${pad.id}" at elevation ${pad.elevation.toFixed(1)}m`);
      console.log("Created pad:", pad);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Error creating pad: ${message}`);
      console.error("Error creating pad:", error);
    }
  };

  // Delete all pads
  const handleDeletePads = async () => {
    try {
      setStatus("Deleting all pads...");
      await Forma.terrain.applyPads([]);
      setPadCount(0);
      setStatus("All pads deleted");
      console.log("All pads deleted");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Error deleting pads: ${message}`);
      console.error("Error deleting pads:", error);
    }
  };

  // Replace all pads with a new set of random pads
  const handleSetPads = async () => {
    try {
      setStatus("Getting terrain bounds...");
      const bbox = await Forma.terrain.getBbox();
      
      setStatus("Generating random pads...");
      const pads = [
        generateRandomPad(bbox),
        generateRandomPad(bbox),
        generateRandomPad(bbox),
      ];
      
      setStatus("Setting pads...");
      await Forma.terrain.applyPads(pads);
      setPadCount(pads.length);
      
      setStatus(`Set ${pads.length} new pads`);
      console.log("Set pads:", pads);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Error setting pads: ${message}`);
      console.error("Error setting pads:", error);
    }
  };

  // Get and log all current pads
  const handleGetPads = async () => {
    try {
      setStatus("Getting pads...");
      const pads = await Forma.terrain.getPads();
      setPadCount(pads.length);
      
      setStatus(`Found ${pads.length} pad(s)`);
      console.log("Current pads:", pads);
      
      // Log detailed info for each pad
      pads.forEach((pad, index) => {
        console.log(`Pad ${index + 1}:`, {
          id: pad.id,
          elevation: pad.elevation,
          slopeAngle: pad.slopeAngle,
          slopePercentage: pad.slopePercentage,
          vertices: pad.coordinates.length,
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Error getting pads: ${message}`);
      console.error("Error getting pads:", error);
    }
  };

  return (
    <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button onClick={handleCreatePad}>Create pad</button>
        <button onClick={handleDeletePads}>Delete all pads</button>
        <button onClick={handleSetPads}>Set 3 random pads</button>
        <button onClick={handleGetPads}>Get and log pads</button>
      </div>
      
      {padCount !== null && (
        <div style={{ marginTop: "8px", fontSize: "14px" }}>
          <strong>Current pad count:</strong> {padCount}
        </div>
      )}
      
      {status && (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
          {status}
        </div>
      )}
    </div>
  );
}
