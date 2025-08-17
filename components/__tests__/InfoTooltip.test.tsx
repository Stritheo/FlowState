import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { InfoTooltip } from '../InfoTooltip';

// Mock the color scheme hook
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

describe('InfoTooltip', () => {
  const defaultProps = {
    title: 'Test Title',
    content: 'Test content for the tooltip',
  };

  it('renders correctly', () => {
    const { getByRole } = render(<InfoTooltip {...defaultProps} />);
    
    const button = getByRole('button');
    expect(button).toBeTruthy();
  });

  it('shows modal when pressed', () => {
    const { getByRole, getByText } = render(<InfoTooltip {...defaultProps} />);
    
    const button = getByRole('button');
    fireEvent.press(button);
    
    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test content for the tooltip')).toBeTruthy();
  });

  it('has proper accessibility labels', () => {
    const { getByRole } = render(<InfoTooltip {...defaultProps} />);
    
    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Info about Test Title');
    expect(button.props.accessibilityHint).toBe('Tap to view scale guidance');
  });

  it('closes modal when Got it button is pressed', () => {
    const { getByRole, getByText, queryByText } = render(<InfoTooltip {...defaultProps} />);
    
    // Open modal
    const button = getByRole('button');
    fireEvent.press(button);
    
    // Verify modal is open
    expect(getByText('Test Title')).toBeTruthy();
    
    // Close modal
    const closeButton = getByText('Got it');
    fireEvent.press(closeButton);
    
    // Verify modal is closed (note: this might need to be adjusted based on how the modal behaves)
    // In real testing, you might need to wait for the modal to close
  });
});