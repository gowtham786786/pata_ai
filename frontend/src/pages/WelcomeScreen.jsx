import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, ArrowRight } from 'lucide-react';

const WelcomeScreen = () => {
  const navigate = useNavigate();

  const handleSelectPortal = (portal) => {
    navigate('/login', { state: { portal } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden z-10 px-4">
      
      {/* Title Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 tracking-tight mb-4 drop-shadow-sm">
          PataAI
        </h1>
        <p className="text-gray-400 dark:text-gray-400 text-lg md:text-xl max-w-xl mx-auto font-light">
          Enterprise-Grade Logistics & AI Agent Platform
        </p>
      </motion.div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl relative z-20">
        
        {/* User Portal Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="group cursor-pointer relative"
          onClick={() => handleSelectPortal('user')}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
          <div className="relative h-full bg-white/10 dark:bg-navy-900/60 backdrop-blur-xl border border-white/20 dark:border-navy-700/50 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center overflow-hidden">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
              <Users className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">User Portal</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 flex-grow">
              Access your personalized dashboard, manage routes, view history, and interact with the AI assistant.
            </p>
            <div className="flex items-center text-blue-500 font-medium group-hover:text-blue-400 transition-colors mt-auto">
              Access Portal <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>

        {/* Admin Portal Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="group cursor-pointer relative"
          onClick={() => handleSelectPortal('admin')}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
          <div className="relative h-full bg-white/10 dark:bg-navy-900/60 backdrop-blur-xl border border-white/20 dark:border-navy-700/50 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center overflow-hidden">
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
              <Shield className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Admin Portal</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 flex-grow">
              Manage system configurations, oversee AI agents, audit logs, and administer platform users.
            </p>
            <div className="flex items-center text-purple-500 font-medium group-hover:text-purple-400 transition-colors mt-auto">
              Access Portal <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default WelcomeScreen;
