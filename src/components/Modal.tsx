'use client';

import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/hooks/useFocusTrap';

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
  const titleId = useId();
  const containerRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- click-outside-to-close backdrop; Escape (handled by useFocusTrap on the dialog below) is the keyboard equivalent, not a key event on this div
    <div className="modal-overlay" onClick={onClose}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- only stops the backdrop's onClose click from bubbling, not a real interactive handler */}
      <div
        ref={containerRef}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
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

        <h2 id={titleId} className="heading-2">{title}</h2>

        {description && <p>{description}</p>}
        
        {date && <p><strong>Date:</strong> {date}</p>}
        
        {additionalImages && additionalImages.length > 0 && (
          <div className="additional-images">
            <h3 className="heading-3">Additional Images</h3>
            <div className="image-gallery">
              {additionalImages.map((img, index) => (
                <img 
                  key={index}
                  src={img} 
                  alt={`${title} (${index + 1})`}
                  style={{ maxWidth: '100%', height: 'auto', maxHeight: '40vh' }}
                />
              ))}
            </div>
          </div>
        )}
        
        {additionalInfo && (
          <div className="additional-info">
            <h3 className="heading-3">Additional Information</h3>
            <p>{additionalInfo}</p>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
