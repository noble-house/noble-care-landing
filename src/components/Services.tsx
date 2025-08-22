import React from 'react';
import { Users, Activity, Utensils, Stethoscope, Smile } from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: Users,
      title: 'Personalized Elderly Care',
      description: 'Daily assistance, companionship, and emotional support tailored to each senior\'s unique needs and preferences.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Activity,
      title: 'Post-Hospitalization Recovery',
      description: 'Professional care to ensure safe and smooth recovery at home after hospital discharge with medical supervision.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Utensils,
      title: 'Wellness & Nutrition Support',
      description: 'Balanced meals, diet planning, and wellness routines designed for a healthy and fulfilling lifestyle.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Stethoscope,
      title: 'Skilled Nursing & Medical Support',
      description: 'Qualified nurses and healthcare professionals providing comprehensive at-home medical attention and care.',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: Smile,
      title: 'Lifestyle Assistance',
      description: 'Help with daily activities, mobility support, and day-to-day tasks delivered with our signature hospitality touch.',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Our Care Services
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive homecare solutions that blend medical expertise with hospitality excellence
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.slice(0, 3).map((service, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
              <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <service.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{service.title}</h3>
              <p className="text-gray-600 leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mt-8 max-w-4xl mx-auto">
          {services.slice(3).map((service, index) => (
            <div key={index + 3} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
              <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <service.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{service.title}</h3>
              <p className="text-gray-600 leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;