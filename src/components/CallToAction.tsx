import React from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { scrollToSection } from '../utils/scrollUtils';

const CallToAction = () => {
  const benefits = [
    'Free initial assessment',
    'Customized care plan',
    'No long-term commitments',
    'Meet your caregiver first'
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Experience Homecare with a 
            <span className="block">Hospitality Touch</span>
          </h2>
          
          <p className="text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto">
            Let us create a personalized care plan for your loved one today. Our team is ready to bring compassionate, professional care to your home.
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-white">
                <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => scrollToSection('contact')}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Book Your Free Assessment
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2">
              Call Now: +918447639569
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;