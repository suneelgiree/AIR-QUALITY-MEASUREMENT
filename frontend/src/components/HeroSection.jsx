import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const HeroSection = ({ bgImages, bgIndex }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
    <div className="flex flex-col md:flex-row items-center md:items-stretch gap-10">
      {/* Left: Text */}
      <div className="flex-1 flex flex-col justify-center md:justify-start md:items-start items-center text-left">
        <h1 className="text-5xl md:text-7xl font-bold text-blue-900 mb-6 text-left">
          Breathe Easy,{' '}
          <span className="bg-gradient-to-r from-blue-700 to-green-700 bg-clip-text text-transparent">
            Live Safe
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-blue-800 mb-12 max-w-3xl leading-relaxed text-left">
          Smarter cities start with safer air, BreathSafe leads the way
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-start items-center">
          <Link
            to="/register"
            className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all transform hover:scale-105 flex items-center space-x-2"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
      {/* Right: Carousel */}
      <div className="flex-1 flex justify-center items-center relative w-full h-72 md:h-auto">
        <div className="w-full h-72 md:h-96 rounded-3xl overflow-hidden shadow-lg relative">
          {bgImages.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`bg${idx + 1}`}
              className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 rounded-3xl ${
                idx === bgIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default HeroSection;