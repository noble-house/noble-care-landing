import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';


function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  // Handle URL changes
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/auth') {
      setCurrentPage('auth');
    } else {
      setCurrentPage('home');
    }
  }, []);

  // Update URL when page changes
  useEffect(() => {
    if (currentPage === 'auth') {
      window.history.pushState({}, '', '/auth');
    } else {
      window.history.pushState({}, '', '/');
    }
  }, [currentPage]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/auth') {
        setCurrentPage('auth');
      } else {
        setCurrentPage('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Function to navigate to auth page
  const navigateToAuth = () => {
    setCurrentPage('auth');
  };

  // Function to navigate back to home
  const navigateToHome = () => {
    setCurrentPage('home');
  };

  // Show loading spinner while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show dashboard if user is logged in
  if (user) {
    // Show admin dashboard for admin users
    if (user.role === 'admin') {
      return <AdminDashboard />;
    }
    return <Dashboard />;
  }

  // Show auth page
  if (currentPage === 'auth') {
    return <Auth onBack={navigateToHome} />;
  }

  // Show landing page
  return (
    <div className="min-h-screen">
      <Header onAuthClick={navigateToAuth} />
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;