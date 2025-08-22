import React from 'react';
import { Heart, Shield, Clock, Home } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Heart,
      title: 'Compassion',
      description: 'Every interaction is guided by empathy and understanding'
    },
    {
      icon: Shield,
      title: 'Professionalism',
      description: 'Highest standards of medical care and service excellence'
    },
    {
      icon: Clock,
      title: 'Reliability',
      description: 'Consistent, dependable care you can count on'
    },
    {
      icon: Home,
      title: 'Comfort',
      description: 'Creating a warm, nurturing environment at home'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                Our Story
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                We believe homecare should feel less like a service and more like family. With years of expertise in healthcare and hospitality, our mission is to deliver holistic, personalized care at home—ensuring dignity, comfort, and companionship for every individual we serve.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <div key={index} className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                    <value.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{value.title}</h3>
                    <p className="text-sm text-gray-600">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <img 
                src="https://images.pexels.com/photos/3768114/pexels-photo-3768114.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                alt="Professional caregiver" 
                className="w-full h-64 object-cover rounded-xl shadow-lg"
              />
              <img 
                src="https://images.pexels.com/photos/3768997/pexels-photo-3768997.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                alt="Home care environment" 
                className="w-full h-64 object-cover rounded-xl shadow-lg mt-8"
              />
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10 rounded-2xl -z-10 transform rotate-2"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;