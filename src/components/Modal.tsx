'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  image?: string;
  additionalImages?: string[];
  description?: string;
  date?: string;
  additionalInfo?: string;
}

export default function Modal({ isOpen, onClose, title, image, additionalImages, description, date, additionalInfo }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          &times;
        </button>
        
        {image && (
          <img 
            src={image} 
            alt={title}
            style={{ maxWidth: '100%', height: 'auto', maxHeight: '80vh' }}
          />
        )}
        
        <h2>{title}</h2>
        
        {description && <p>{description}</p>}
        
        {date && <p><strong>Date:</strong> {date}</p>}
        
        {additionalImages && additionalImages.length > 0 && (
          <div className="additional-images">
            <h3>Additional Images</h3>
            <div className="image-gallery">
              {additionalImages.map((img, index) => (
                <img 
                  key={index}
                  src={img} 
                  alt={`${title} - Additional image ${index + 1}`}
                  style={{ maxWidth: '100%', height: 'auto', maxHeight: '40vh' }}
                />
              ))}
            </div>
          </div>
        )}
        
        {additionalInfo && (
          <div className="additional-info">
            <h3>Additional Information</h3>
            <p>{additionalInfo}</p>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
