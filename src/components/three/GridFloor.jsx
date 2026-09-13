import { Grid } from '@react-three/drei'

// Wireframe floor grid extending toward the horizon. A single shader-driven
// mesh (drei's Grid) rather than hand-built line instances -- one draw call.
export default function GridFloor() {
  return (
    <Grid
      position={[0, 0, 0]}
      args={[10, 10]}
      cellSize={0.75}
      cellThickness={0.5}
      cellColor="#0f3d2e"
      sectionSize={4.5}
      sectionThickness={1.1}
      sectionColor="#39ff88"
      fadeDistance={32}
      fadeStrength={1.4}
      fadeFrom={0}
      infiniteGrid
      followCamera={false}
    />
  )
}
