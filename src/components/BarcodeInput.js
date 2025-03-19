import React, { useState, useCallback } from 'react';

const BarcodeInput = React.memo(({ onScan }) => {
  const [barcode, setBarcode] = useState('');

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setBarcode(value);

    if (e.key === 'Enter' && value.trim() !== '') {
      onScan(value.trim());
      setBarcode('');
    }
  }, [onScan]);

  return (
    <div>
      <h5>바코드 스캔</h5>
      <input
        type="text"
        className="form-control"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        onKeyPress={handleInputChange}
        placeholder="바코드 리더기로 스캔하세요"
        autoFocus
      />
    </div>
  );
});

export default BarcodeInput;