import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';

// Simple test component
const TestComponent: React.FC<{ title: string }> = ({ title }) => {
  return (
    <View testID="test-component">
      <Text testID="title">{title}</Text>
    </View>
  );
};

describe('Simple Component Tests', () => {
  it('should render a simple component', () => {
    const { getByTestId } = render(<TestComponent title="Test Title" />);
    
    expect(getByTestId('test-component')).toBeTruthy();
    expect(getByTestId('title')).toBeTruthy();
  });

  it('should display the correct title', () => {
    const testTitle = 'Hello World';
    const { getByText } = render(<TestComponent title={testTitle} />);
    
    expect(getByText(testTitle)).toBeTruthy();
  });

  it('should handle empty props', () => {
    const { getByTestId } = render(<TestComponent title="" />);
    
    expect(getByTestId('test-component')).toBeTruthy();
  });

  it('should render multiple instances', () => {
    const { getAllByTestId } = render(
      <View>
        <TestComponent title="First" />
        <TestComponent title="Second" />
      </View>
    );
    
    expect(getAllByTestId('test-component')).toHaveLength(2);
  });

  it('should validate React component structure', () => {
    const component = <TestComponent title="Test" />;
    expect(React.isValidElement(component)).toBe(true);
  });
});