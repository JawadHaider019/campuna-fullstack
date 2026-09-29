'use client';

import React from 'react';
import { motion } from 'framer-motion';

const sectionVariants = {
  hidden: { 
    opacity: 0, 
    y: 36,
    scale: 0.99
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.7, 
      ease: [0.21, 0.47, 0.32, 0.98] 
    } 
  }
};

export default function ScrollSectionWrapper({ 
  children, 
  className = "", 
  delay = 0,
  id,
  margin = "0px",
  amount = 0.1
}) {
  return (
    <motion.div
      id={id}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin, amount }}
      transition={{ delay }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}
