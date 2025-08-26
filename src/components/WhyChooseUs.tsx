import React from 'react';
import { Award, Clock, Sparkles, FileText } from 'lucide-react';

const WhyChooseUs = () => {
  const features = [
    {
      icon: Award,
      title: 'Hospitality-Trained Caregivers',
      description: 'Our team treats your home with respect and brings world-class service standards to healthcare.'
    },
    {
      icon: Clock,
      title: '24/7 Support & Flexible Plans',
      description: 'Round-the-clock availability with customizable care plans that adapt to your family\'s needs.'
    },
    {
      icon: Sparkles,
      title: 'Medical Expertise + Lifestyle Comfort',
      description: 'Perfect blend of clinical competence and hospitality warmth for comprehensive care.'
    },
    {
      icon: FileText,
      title: 'Transparent & Family-Focused',
      description: 'Clear processes, regular updates, and active family involvement in all care decisions.'
    }
  ];

  const stats = [
    { number: '500+', label: 'Families Served' },
    { number: '95%', label: 'Client Satisfaction' },
    { number: '24/7', label: 'Care Availability' }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Why Families Trust Us
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the difference when healthcare meets hospitality excellence
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="text-center space-y-4 group">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-center">
          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-white">
                <div className="text-4xl lg:text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;