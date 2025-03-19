import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BarcodeInput from '../BarcodeInput';

describe('BarcodeInput', () => {
  test('renders input field with placeholder', () => {
    render(<BarcodeInput onScan={() => {}} />);
    const inputElement = screen.getByPlaceholderText('바코드 리더기로 스캔하세요');
    expect(inputElement).toBeInTheDocument();
  });

  test('calls onScan when Enter key is pressed with valid barcode', () => {
    const mockOnScan = jest.fn();
    render(<BarcodeInput onScan={mockOnScan} />);
    const inputElement = screen.getByPlaceholderText('바코드 리더기로 스캔하세요');

    fireEvent.change(inputElement, { target: { value: 'MWAJK1/MR/M' } });
    fireEvent.keyPress(inputElement, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(mockOnScan).toHaveBeenCalledWith('MWAJK1/MR/M');
    expect(inputElement.value).toBe(''); // 입력 필드가 초기화되었는지 확인
  });

  test('does not call onScan when Enter key is pressed with empty input', () => {
    const mockOnScan = jest.fn();
    render(<BarcodeInput onScan={mockOnScan} />);
    const inputElement = screen.getByPlaceholderText('바코드 리더기로 스캔하세요');

    fireEvent.keyPress(inputElement, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(mockOnScan).not.toHaveBeenCalled();
  });
});