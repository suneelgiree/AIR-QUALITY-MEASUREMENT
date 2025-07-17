import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ServicesSection from '../components/ServicesSection';
import AboutUsSection from '../components/AboutUsSection';
import Footer from '../components/Footer';
import {
  RefreshCw,
  BarChart2,
  Globe,
  Bell,
} from 'lucide-react';
import person1 from '../assets/person1.jpg';
import person2 from '../assets/person2.jpg';
import person3 from '../assets/person3.jpg';
import person4 from '../assets/person4.jpg';
import bg1 from '../assets/bg1.jpg';
import bg2 from '../assets/bg2.jpg';
import bg3 from '../assets/bg3.jpg';

const bgImages = [bg1, bg2, bg3];

const features = [
  {
    icon: RefreshCw,
    title: 'Real-time Air Quality Monitoring',
    description: 'Continuous collection of air pollution data using IoT sensor networks deployed across urban areas.'
  },
  {
    icon: BarChart2,
    title: 'Accurate AQI Prediction',
    description: 'Advanced machine learning models predict future air quality indices to help inform preventive measures.'
  },
  {
    icon: Globe,
    title: 'Multilingual Support',
    description: 'Our platform supports multiple languages to serve diverse urban communities effectively.'
  },
  {
    icon: Bell,
    title: 'Real-time Alerts & Notifications',
    description: 'Get instant air quality alerts via browser notifications and email to stay informed and safe.'
  }
];

const team = [
  {
    name: 'Slok Regmi',
    role: 'AI And Sensor Specialist',
    desc: 'Leads the integration of AI models and IoT sensors for accurate, real-time air quality monitoring.',
    link: 'https://www.facebook.com/search/top/?q=slok',
    photo: person1
  },
  {
    name: 'Suneel Giri',
    role: 'Backend Developer',
    desc: 'Develops and maintains robust backend systems, ensuring secure and efficient data processing.',
    link: 'https://www.facebook.com/suneel.giri946',
    photo: person2
  },
  {
    name: 'Prajil Baral',
    role: 'Documentation Specialist',
    desc: 'Creates clear, user-friendly documentation and guides for both users and developers.',
    link: 'https://www.facebook.com/prajeel',
    photo: person3
  },
  {
    name: 'Laxman Khatri',
    role: 'frontend Developer',
    desc: 'Designs and implements intuitive, responsive user interfaces for a seamless user experience.',
    link: 'https://www.facebook.com/laxman.khatri.328/',
    photo: person4
  }
];

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [language, setLanguage] = useState('English');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    setLangOpen(false);
  };

  // Navbar links for reuse
  const navLinks = (
    <>
      <a href="/" className="text-blue-800 hover:text-green-600 transition-colors font-medium block py-2 px-2">
        Home
      </a>
      <a href="/aqi" className="text-blue-800 hover:text-green-600 transition-colors font-medium block py-2 px-2">
        AQI
      </a>
      <a href="#services" className="text-blue-800 hover:text-green-600 transition-colors font-medium block py-2 px-2">
        Our Services
      </a>
      <a href="/forecasting" className="text-blue-800 hover:text-green-600 transition-colors font-medium block py-2 px-2">
        Forecasting
      </a>
      <a href="#aboutus" className="text-blue-800 hover:text-green-600 transition-colors font-medium block py-2 px-2">
        About Us
      </a>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-slate-50">
      <Navbar
        scrolled={scrolled}
        navLinks={navLinks}
        langOpen={langOpen}
        setLangOpen={setLangOpen}
        language={language}
        handleLanguageSelect={handleLanguageSelect}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <HeroSection bgImages={bgImages} bgIndex={bgIndex} />
      <ServicesSection features={features} />
      <AboutUsSection team={team} />
      <Footer />
    </div>
  );
};

export default LandingPage;