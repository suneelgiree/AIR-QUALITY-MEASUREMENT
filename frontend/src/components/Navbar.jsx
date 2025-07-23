import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Menu, X } from 'lucide-react';
import logo from '../assets/logo-transparent.png';
import { useTranslation } from 'react-i18next';

const Navbar = ({
  scrolled,
  navLinks,
  langOpen,
  setLangOpen,
  language,
  setLanguage,
  mobileOpen,
  setMobileOpen,
}) => {
  const { i18n, t } = useTranslation();

  const handleLanguageSelect = (lang) => {
    if (lang === 'English') i18n.changeLanguage('en');
    else if (lang === 'Nepali') i18n.changeLanguage('np');
    else if (lang === 'Hindi') i18n.changeLanguage('hi');
    else i18n.changeLanguage('en');

    setLanguage(lang);
    setLangOpen(false);
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-500 ease-in-out ${
        scrolled
          ? 'bg-white/80 backdrop-blur-md shadow-md'
          : 'bg-white/10 backdrop-blur-md'
      } border-b border-white/20`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow">
              <img src={logo} alt="BreathSafe Logo" className="h-8 w-8 object-contain" />
            </div>
            <span className="text-xl font-bold text-blue-900">BreathSafe</span>
          </div>
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Use translation for nav links */}
            <Link
              to="/"
              className="text-blue-800 hover:text-green-600 transition-colors font-medium block py-2 px-2"
            >
              {t('navbar.home')}
            </Link>
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
            {/* Language dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center px-3 py-1 bg-white rounded-md border border-blue-200 text-blue-800 hover:text-green-600 transition-colors font-medium focus:outline-none"
              >
                <Globe className="w-5 h-5 mr-1" />
                {language}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-blue-200 rounded-md shadow-lg z-50">
                  {['English', 'Nepali', 'Hindi'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageSelect(lang)}
                      className="block w-full text-left px-4 py-2 hover:bg-blue-50"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link
              to="/register"
              className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-full hover:from-blue-700 hover:to-green-700 transition-all transform hover:scale-105 font-semibold"
            >
              {t('navbar.getStarted')}
            </Link>
          </div>
          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-md hover:bg-blue-100 transition-colors"
            >
              {mobileOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md rounded-b-xl shadow-lg px-4 pt-2 pb-4 space-y-2">
            {/* Mobile nav links */}
            <Link
              to="/"
              className="text-blue-800 hover:text-green-600 transition-colors font-medium block py-2 px-2"
              onClick={() => setMobileOpen(false)}
            >
              {t('navbar.home')}
            </Link>
            <a
              href="#services"
              className="text-blue-800 hover:text-green-600 transition-colors font-medium block py-2 px-2"
              onClick={() => setMobileOpen(false)}
            >
              {t('navbar.services')}
            </a>
            <a
              href="#aboutus"
              className="text-blue-800 hover:text-green-600 transition-colors font-medium block py-2 px-2"
              onClick={() => setMobileOpen(false)}
            >
              {t('navbar.about')}
            </a>
            {/* Language dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center px-3 py-1 bg-white rounded-md border border-blue-200 text-blue-800 hover:text-green-600 transition-colors font-medium focus:outline-none w-full"
              >
                <Globe className="w-5 h-5 mr-1" />
                {language}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-blue-200 rounded-md shadow-lg z-50">
                  {['English', 'Nepali', 'Hindi'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        handleLanguageSelect(lang);
                        setMobileOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-blue-50"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link
              to="/register"
              className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-full hover:from-blue-700 hover:to-green-700 transition-all transform hover:scale-105 font-semibold block mt-2"
              onClick={() => setMobileOpen(false)}
            >
              {t('navbar.getStarted')}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
