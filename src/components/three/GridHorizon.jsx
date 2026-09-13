import { Grid } from '@react-three/drei'

export default function GridHorizon() {
  return (
    <Grid
      position={[0, -3.2, 0]}
      args={[10, 10]}
      cellSize={1}
      cellThickness={0.4}
      cellColor="#173a4d"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#4df1ff"
      fadeDistance={55}
      fadeStrength={1.6}
      infiniteGrid
      followCamera={false}
    />
  )
}
