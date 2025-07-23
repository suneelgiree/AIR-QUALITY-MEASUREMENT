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
import { useTranslation } from 'react-i18next';

const bgImages = [bg1, bg2, bg3];

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [language, setLanguage] = useState('English');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  const { t, i18n } = useTranslation();

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

  // Features with translations
  const features = [
    {
      icon: RefreshCw,
      title: t('features.feature1_title'),
      description: t('features.feature1_desc'),
    },
    {
      icon: BarChart2,
      title: t('features.feature2_title'),
      description: t('features.feature2_desc'),
    },
    {
      icon: Globe,
      title: t('features.feature3_title'),
      description: t('features.feature3_desc'),
    },
    {
      icon: Bell,
      title: t('features.feature4_title'),
      description: t('features.feature4_desc'),
    },
  ];

  // Team can remain static or add translations similarly if needed
const team = [
  {
    name: 'Slok Regmi',
    key: 'slok',
    link: 'https://www.facebook.com/search/top/?q=slok',
    photo: person1,
  },
  {
    name: 'Suneel Giri',
    key: 'suneel',
    link: 'https://www.facebook.com/suneel.giri946',
    photo: person2,
  },
  {
    name: 'Prajil Baral',
    key: 'prajil',
    link: 'https://www.facebook.com/prajeel',
    photo: person3,
  },
  {
    name: 'Laxman Khatri',
    key: 'laxman',
    link: 'https://www.facebook.com/laxman.khatri.328/',
    photo: person4,
  },
];


  // Navbar links (use translated text directly)
  const navLinks = (
    <>
      <a
        href="/"
        className="text-blue-800 hover:text-green-600 transition-colors font-medium block py-2 px-2"
      >
        {t('navbar.home')}
      </a>
      <a
        href="#services"
        className="text-blue-800 hover:text-green-600 transition-colors font-medium block py-2 px-2"
      >
        {t('navbar.services')}
      </a>
      <a
        href="#aboutus"
        className="text-blue-800 hover:text-green-600 transition-colors font-medium block py-2 px-2"
      >
        {t('navbar.about')}
      </a>
    </>
  );

  // Sync local language state with i18n on mount
  useEffect(() => {
    const currentLang = i18n.language;
    if (currentLang === 'en') setLanguage('English');
    else if (currentLang === 'np') setLanguage('Nepali');
    else if (currentLang === 'hi') setLanguage('Hindi');
    else setLanguage('English');
  }, [i18n.language]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-slate-50">
      <Navbar
        scrolled={scrolled}
        navLinks={navLinks}
        langOpen={langOpen}
        setLangOpen={setLangOpen}
        language={language}
        setLanguage={setLanguage}
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
