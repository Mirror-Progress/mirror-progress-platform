// components/Header.tsx

import React, { useState } from 'react';
import ContactFormModal from './ContactFormModal';

const Header: React.FC = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const openContactModal = () => {
    setIsContactModalOpen(true);
  };

  const closeContactModal = () => {
    setIsContactModalOpen(false);
  };

  return (
    <header className="bg-white shadow-md py-4">
      <div className="container mx-auto flex justify-between items-center px-4">
        {/* Logo or Site Title */}
        <div className="text-xl font-bold">
          <a href="/">Mirror Progress</a>
        </div>

        {/* Navigation and Contact Button */}
        <nav className="flex items-center space-x-4">
          {/* Add other navigation links here */}
          
          {/* Contact Us Button */}
          <button
            onClick={openContactModal}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Contact Us
          </button>
        </nav>
      </div>

      {/* Contact Form Modal */}
      <ContactFormModal isOpen={isContactModalOpen} onClose={closeContactModal} />
    </header>
  );
};

export default Header;
