import { useEffect, useState } from 'react';

interface RotatingCubeProps {
  gyroX: number;
  gyroY: number;
  gyroZ: number;
}

export const RotatingCube = ({ gyroX, gyroY, gyroZ }: RotatingCubeProps) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  
  // Conversion from radians to degrees (π rad = 180°)
  const RAD_TO_DEG = 180 / Math.PI;
  // Scale factor to amplify gyro readings for better visualization
  // Adjust this value based on your sensor's typical output range
  const SCALE_FACTOR = 0.5;

  useEffect(() => {
    // Convert radians to degrees and apply scaling
    setRotation({
      x: gyroX * RAD_TO_DEG * SCALE_FACTOR,
      y: gyroY * RAD_TO_DEG * SCALE_FACTOR,
      z: gyroZ * RAD_TO_DEG * SCALE_FACTOR,
    });
  }, [gyroX, gyroY, gyroZ]);

  const cubeStyle: React.CSSProperties = {
    width: '150px',
    height: '150px',
    position: 'relative',
    transformStyle: 'preserve-3d',
    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
    margin: '0 auto',
    marginTop: '20px',
  };

  const faceStyle: React.CSSProperties = {
    position: 'absolute',
    width: '150px',
    height: '150px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    opacity: 0.8,
    border: '2px solid rgba(255, 255, 255, 0.3)',
  };

  const faces = [
    { transform: 'translateZ(75px)', bg: 'rgba(255, 99, 132, 0.7)', label: 'Front' },
    { transform: 'rotateY(180deg) translateZ(75px)', bg: 'rgba(54, 162, 235, 0.7)', label: 'Back' },
    { transform: 'rotateY(90deg) translateZ(75px)', bg: 'rgba(75, 192, 75, 0.7)', label: 'Right' },
    { transform: 'rotateY(-90deg) translateZ(75px)', bg: 'rgba(255, 206, 86, 0.7)', label: 'Left' },
    { transform: 'rotateX(90deg) translateZ(75px)', bg: 'rgba(153, 102, 255, 0.7)', label: 'Top' },
    { transform: 'rotateX(-90deg) translateZ(75px)', bg: 'rgba(255, 159, 64, 0.7)', label: 'Bottom' },
  ];

  return (
    <div style={{ perspective: '1000px', width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={cubeStyle}>
        {faces.map((face, idx) => (
          <div
            key={idx}
            style={{
              ...faceStyle,
              transform: face.transform,
              backgroundColor: face.bg,
            }}
          >
            {face.label}
          </div>
        ))}
      </div>
    </div>
  );
};
