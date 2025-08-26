import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import WhyChooseUs from './components/WhyChooseUs';
import Testimonials from './components/Testimonials';
import CallToAction from './components/CallToAction';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';

function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <div id="about">
          <About />
        </div>
        <div id="services">
          <Services />
        </div>
        <div id="why-choose">
          <WhyChooseUs />
        </div>
        <div id="testimonials">
          <Testimonials />
        </div>
        <CallToAction />
        <div id="contact">
          <Contact />
        </div>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

export default LandingPage;
