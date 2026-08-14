import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';

let targetX = 0;
let targetY = 0;
let isMoving = false;
let moveTimeout = null;

function StarField() {
  const ref = useRef();
  const curX = useRef(0);
  const curY = useRef(0);
  const autoAngle = useRef(0);

  useFrame((state) => {
    if (isMoving) {
      // Smooth follow
      curX.current += (targetX - curX.current) * 0.025;
      curY.current += (targetY - curY.current) * 0.025;
    } else {
      // Gentle auto drift
      autoAngle.current += 0.0008;
      curX.current += (autoAngle.current - curX.current) * 0.008;
      curY.current += (0 - curY.current) * 0.005;
    }

    ref.current.rotation.y = curX.current;
    ref.current.rotation.x = curY.current;
  });

  return (
    <group ref={ref}>
      <Stars
        radius={100}
        depth={50}
        count={8000}
        factor={6}
        fade
        speed={0}
        saturation={0}
      />
    </group>
  );
}

export default function AmbulanceScene() {

  useEffect(() => {
    const handleMouseMove = (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 1.0;
      targetY = -(e.clientY / window.innerHeight - 0.5) * 0.6;
      isMoving = true;

      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        isMoving = false;
      }, 2000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(moveTimeout);
    };
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 75 }}
      style={{ background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
    >
      <StarField />
    </Canvas>
  );
}
