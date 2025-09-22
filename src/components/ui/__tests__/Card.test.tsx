import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardTitle } from '../Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render children correctly', () => {
      render(
        <Card>
          <div>Test content</div>
        </Card>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(
        <Card>
          <div>Test content</div>
        </Card>
      );

      const card = screen.getByText('Test content').parentElement;
      expect(card).toHaveClass('bg-white', 'rounded-lg', 'border', 'border-gray-200', 'shadow-sm');
    });

    it('should merge custom className with default classes', () => {
      render(
        <Card className="custom-class">
          <div>Test content</div>
        </Card>
      );

      const card = screen.getByText('Test content').parentElement;
      expect(card).toHaveClass('bg-white', 'rounded-lg', 'border', 'border-gray-200', 'shadow-sm', 'custom-class');
    });

    it('should override conflicting classes', () => {
      render(
        <Card className="bg-red-500">
          <div>Test content</div>
        </Card>
      );

      const card = screen.getByText('Test content').parentElement;
      expect(card).toHaveClass('bg-red-500');
      expect(card).not.toHaveClass('bg-white');
    });
  });

  describe('CardHeader', () => {
    it('should render children correctly', () => {
      render(
        <CardHeader>
          <div>Header content</div>
        </CardHeader>
      );

      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(
        <CardHeader>
          <div>Header content</div>
        </CardHeader>
      );

      const header = screen.getByText('Header content').parentElement;
      expect(header).toHaveClass('px-6', 'py-4', 'border-b', 'border-gray-200');
    });

    it('should merge custom className', () => {
      render(
        <CardHeader className="custom-header">
          <div>Header content</div>
        </CardHeader>
      );

      const header = screen.getByText('Header content').parentElement;
      expect(header).toHaveClass('px-6', 'py-4', 'border-b', 'border-gray-200', 'custom-header');
    });
  });

  describe('CardContent', () => {
    it('should render children correctly', () => {
      render(
        <CardContent>
          <div>Content text</div>
        </CardContent>
      );

      expect(screen.getByText('Content text')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(
        <CardContent>
          <div>Content text</div>
        </CardContent>
      );

      const content = screen.getByText('Content text').parentElement;
      expect(content).toHaveClass('px-6', 'py-4');
    });

    it('should merge custom className', () => {
      render(
        <CardContent className="custom-content">
          <div>Content text</div>
        </CardContent>
      );

      const content = screen.getByText('Content text').parentElement;
      expect(content).toHaveClass('px-6', 'py-4', 'custom-content');
    });
  });

  describe('CardTitle', () => {
    it('should render children correctly', () => {
      render(
        <CardTitle>
          Title Text
        </CardTitle>
      );

      expect(screen.getByText('Title Text')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(
        <CardTitle>
          Title Text
        </CardTitle>
      );

      const title = screen.getByText('Title Text');
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-gray-900');
      expect(title.tagName).toBe('H3');
    });

    it('should merge custom className', () => {
      render(
        <CardTitle className="custom-title">
          Title Text
        </CardTitle>
      );

      const title = screen.getByText('Title Text');
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-gray-900', 'custom-title');
    });

    it('should override conflicting classes', () => {
      render(
        <CardTitle className="text-red-500">
          Title Text
        </CardTitle>
      );

      const title = screen.getByText('Title Text');
      expect(title).toHaveClass('text-red-500');
      expect(title).not.toHaveClass('text-gray-900');
    });
  });

  describe('Card composition', () => {
    it('should work together as a complete card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the card content</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('This is the card content')).toBeInTheDocument();
      
      const title = screen.getByText('Card Title');
      const content = screen.getByText('This is the card content');
      
      expect(title.tagName).toBe('H3');
      expect(content.tagName).toBe('P');
    });

    it('should maintain proper structure and styling when composed', () => {
      render(
        <Card className="max-w-md">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-blue-600">Test Card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Content paragraph</p>
          </CardContent>
        </Card>
      );

      const card = screen.getByText('Content paragraph').closest('div[class*="bg-white"]');
      const header = screen.getByText('Test Card').closest('div[class*="px-6"]');
      const title = screen.getByText('Test Card');
      const content = screen.getByText('Content paragraph').parentElement;

      expect(card).toHaveClass('max-w-md');
      expect(header).toHaveClass('bg-gray-50');
      expect(title).toHaveClass('text-blue-600');
      expect(content).toHaveClass('space-y-4');
    });
  });
});