import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#06080F] pointer-events-none select-none">
      {/* Precision Linear High-Tech Dot Matrix */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(rgba(0, 240, 255, 0.9) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />

      {/* Atmospheric Neon Cyan & Deep Void Orbs */}
      <motion.div
        animate={{
          x: [0, 40, 0],
          y: [0, 30, 0],
          opacity: [0.15, 0.22, 0.15],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[20%] left-[5%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-blue-600/25 via-cyan-500/15 to-transparent blur-[140px]"
      />
      
      <motion.div
        animate={{
          x: [0, -40, 0],
          y: [0, -30, 0],
          opacity: [0.1, 0.18, 0.1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-[20%] right-[0%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-cyan-500/20 via-blue-700/15 to-transparent blur-[160px]"
      />

      {/* Smooth Subtle Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06080F]/40 via-transparent to-[#06080F]/80 pointer-events-none" />
    </div>
  );
};

export default AnimatedBackground;
