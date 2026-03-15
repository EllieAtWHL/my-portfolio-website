import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from '../Modal'

// Mock createPortal to render in the test environment
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (element: React.ReactElement) => element
}))

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset body styles
    document.body.style.overflow = ''
  })

  afterEach(() => {
    // Clean up body styles after each test
    document.body.style.overflow = ''
  })

  it('renders when isOpen is true', () => {
    render(<Modal {...defaultProps} />)
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    expect(screen.getByText('×')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument()
  })

  it('renders with image when provided', () => {
    render(
      <Modal 
        {...defaultProps} 
        image="https://example.com/test-image.jpg"
      />
    )
    
    const image = screen.getByAltText('Test Modal')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/test-image.jpg')
  })

  it('renders with description when provided', () => {
    render(
      <Modal 
        {...defaultProps} 
        description="This is a test description"
      />
    )
    
    expect(screen.getByText('This is a test description')).toBeInTheDocument()
  })

  it('renders with date when provided', () => {
    render(
      <Modal 
        {...defaultProps} 
        date="March 15, 2024"
      />
    )
    
    expect(screen.getByText('Date:')).toBeInTheDocument()
    expect(screen.getByText('March 15, 2024')).toBeInTheDocument()
  })

  it('renders with additional images when provided', () => {
    const additionalImages = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg'
    ]
    
    render(
      <Modal 
        {...defaultProps} 
        additionalImages={additionalImages}
      />
    )
    
    expect(screen.getByText('Additional Images')).toBeInTheDocument()
    
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2) // Only additional images (no main image provided)
    
    expect(images[0]).toHaveAttribute('alt', 'Test Modal - Additional image 1')
    expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg')
    expect(images[1]).toHaveAttribute('alt', 'Test Modal - Additional image 2')
    expect(images[1]).toHaveAttribute('src', 'https://example.com/image2.jpg')
  })

  it('renders with additional info when provided', () => {
    render(
      <Modal 
        {...defaultProps} 
        additionalInfo="Additional information content"
      />
    )
    
    expect(screen.getByText('Additional Information')).toBeInTheDocument()
    expect(screen.getByText('Additional information content')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn()
    render(<Modal {...defaultProps} onClose={mockOnClose} />)
    
    const closeButton = screen.getByLabelText('Close modal')
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay is clicked', () => {
    const mockOnClose = jest.fn()
    render(<Modal {...defaultProps} onClose={mockOnClose} />)
    
    const overlay = screen.getByText('Test Modal').closest('.modal-overlay')
    fireEvent.click(overlay!)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when modal content is clicked', () => {
    const mockOnClose = jest.fn()
    render(<Modal {...defaultProps} onClose={mockOnClose} />)
    
    const content = screen.getByText('Test Modal').closest('.modal-content')
    fireEvent.click(content!)
    
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('sets body overflow to hidden when opened', () => {
    render(<Modal {...defaultProps} />)
    
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('resets body overflow when closed', () => {
    const { rerender } = render(<Modal {...defaultProps} />)
    
    expect(document.body.style.overflow).toBe('hidden')
    
    rerender(<Modal {...defaultProps} isOpen={false} />)
    
    expect(document.body.style.overflow).toBe('unset')
  })

  it('adds and removes escape key listener', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener')
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
    
    const { unmount } = render(<Modal {...defaultProps} />)
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })

  it('calls onClose when Escape key is pressed', () => {
    const mockOnClose = jest.fn()
    render(<Modal {...defaultProps} onClose={mockOnClose} />)
    
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose for other keys', () => {
    const mockOnClose = jest.fn()
    render(<Modal {...defaultProps} onClose={mockOnClose} />)
    
    fireEvent.keyDown(document, { key: 'Enter' })
    fireEvent.keyDown(document, { key: 'Space' })
    
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('renders all content together correctly', () => {
    const fullProps = {
      ...defaultProps,
      image: 'https://example.com/main.jpg',
      additionalImages: ['https://example.com/additional.jpg'],
      description: 'Test description',
      date: '2024-03-15',
      additionalInfo: 'Additional info'
    }
    
    render(<Modal {...fullProps} />)
    
    // Check all elements are present
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByAltText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
    expect(screen.getByText('Date:')).toBeInTheDocument()
    expect(screen.getByText('2024-03-15')).toBeInTheDocument()
    expect(screen.getByText('Additional Images')).toBeInTheDocument()
    expect(screen.getByText('Additional Information')).toBeInTheDocument()
    expect(screen.getByText('Additional info')).toBeInTheDocument()
    expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
  })

  it('does not render additional images section when array is empty', () => {
    render(
      <Modal 
        {...defaultProps} 
        additionalImages={[]}
      />
    )
    
    expect(screen.queryByText('Additional Images')).not.toBeInTheDocument()
  })

  it('handles missing optional props gracefully', () => {
    render(<Modal {...defaultProps} />)
    
    // Should render only title and close button
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    
    // Should not render optional content
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText('Date:')).not.toBeInTheDocument()
    expect(screen.queryByText('Additional Images')).not.toBeInTheDocument()
    expect(screen.queryByText('Additional Information')).not.toBeInTheDocument()
  })
})
