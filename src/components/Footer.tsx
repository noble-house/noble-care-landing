import React from 'react';
import { Heart, Facebook, Twitter, Instagram, Linkedin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  const quickLinks = [
    { name: 'About Us', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Careers', href: '#careers' },
    { name: 'Blog', href: '#blog' },
    { name: 'Contact', href: '#contact' }
  ];

  const services = [
    'Elderly Care',
    'Post-Hospital Recovery',
    'Wellness Support',
    'Skilled Nursing',
    'Lifestyle Assistance'
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Noble Care</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Compassionate homecare with hospitality excellence. Bringing professional healthcare and warm comfort to your loved ones at home.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300">+918447639569</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300">care@thinknoblehouse.com</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href} 
                    className="text-gray-300 hover:text-blue-400 transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-6">Our Services</h3>
            <ul className="space-y-3">
              {services.map((service, index) => (
                <li key={index} className="text-gray-300">
                  {service}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-6">Connect With Us</h3>
            <div className="flex gap-4 mb-6">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
            <div className="bg-gray-800 p-4 rounded-xl">
              <h4 className="font-semibold mb-2">24/7 Emergency Support</h4>
              <p className="text-sm text-gray-300">
                Round-the-clock assistance for urgent care needs and emergencies.
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-gray-300">
              <span>© 2025 Noble Care. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-sm">Care with Compassion. Hospitality at Heart.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;