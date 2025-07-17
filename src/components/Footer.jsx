import React from 'react';
import logo from '../assets/logo-transparent.png';
import { Linkedin, Twitter, Github } from 'lucide-react';

const Footer = () => (
    <footer className="bg-gray-100 border-t border-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid md:grid-cols-4 gap-4 items-center">
                <div className="col-span-2">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-7 h-7 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                            <img src={logo} alt="BreathSafe Logo" className="h-5 w-5 object-contain" />
                        </div>
                        <span className="text-lg font-bold text-blue-900">BreathSafe</span>
                    </div>
                    <p className="text-blue-800 text-sm max-w-xs">
                        Breathe freely, breathe safely - trust Breathsafe
                    </p>
                </div>
                <div>
                    <h4 className="text-blue-900 font-semibold mb-2 text-base">Support</h4>
                    <ul className="space-y-1 text-blue-800 text-sm">
                        <li><a href="#" className="hover:text-blue-900 transition-colors">Help Center</a></li>
                        <li><a href="#" className="hover:text-blue-900 transition-colors">Contact Us</a></li>
                        <li><a href="#" className="hover:text-blue-900 transition-colors">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-blue-900 transition-colors">Terms of Service</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-blue-900 font-semibold mb-2 text-base">Connect with us</h4>
                    <div className="flex space-x-3">
                        <a href="#" className="text-blue-800 hover:text-blue-900 transition-colors">
                            <Linkedin className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-blue-800 hover:text-blue-900 transition-colors">
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-blue-800 hover:text-blue-900 transition-colors">
                            <Github className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
            <div className="border-t border-gray-300 mt-3 pt-3 text-center text-blue-800 text-xs">
                <p>&copy; 2024 BreathSafe. All rights reserved.</p>
            </div>
        </div>
    </footer>
);

export default Footer;