import React, { useState, useEffect, useMemo } from 'react';

const DataTable = React.memo(({ scannedData, overallProgress, lastScannedSku, setLastScannedSku }) => {
  const [filterStyle, setFilterStyle] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [highlightedSku, setHighlightedSku] = useState(null);

  useEffect(() => {
    if (lastScannedSku) {
      setHighlightedSku(lastScannedSku);
      const timer = setTimeout(() => {
        setHighlightedSku(null);
        setLastScannedSku(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [lastScannedSku, setLastScannedSku]);

  const filteredData = useMemo(() => {
    return scannedData.filter((item) => {
      const [style, color, size] = item.sku.split('-');
      return (
        (filterStyle === '' || style.toLowerCase().includes(filterStyle.toLowerCase())) &&
        (filterColor === '' || color.toLowerCase().includes(filterColor.toLowerCase())) &&
        (filterSize === '' || size.toLowerCase().includes(filterSize.toLowerCase()))
      );
    });
  }, [scannedData, filterStyle, filterColor, filterSize]);

  return (
    <div>
      <h5>작업 이력</h5>
      <div className="d-flex justify-content-between mb-3">
        <span>전체 진행률: {overallProgress.toFixed(1)}%</span>
        <span>전체 진행률: {overallProgress.toFixed(1)}%</span>
      </div>

      <div className="row mb-3">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="스타일 번호 필터"
            value={filterStyle}
            onChange={(e) => setFilterStyle(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="색상 필터"
            value={filterColor}
            onChange={(e) => setFilterColor(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="사이즈 필터"
            value={filterSize}
            onChange={(e) => setFilterSize(e.target.value)}
          />
        </div>
      </div>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>전체 진행률</th>
            <th>바코드</th>
            <th>입고 처리 현황</th>
            <th>스캔 시간</th>
            <th>SKU</th>
            <th>예상 수량</th>
            <th>실제 수량</th>
            <th>진행률</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length === 0 ? (
            <tr>
              <td colSpan="9">데이터가 없습니다.</td>
            </tr>
          ) : (
            filteredData.map((item, index) => {
              const progress = item.expectedQuantity > 0
                ? (item.actualQuantity / item.expectedQuantity) * 100
                : 0;
              const status = progress === 0 ? '진행 중' : progress >= 100 ? '진행 중' : '진행 중';
              const isHighlighted = highlightedSku === item.sku;

              return (
                <tr
                  key={index}
                  className={isHighlighted ? 'highlight-row' : ''}
                  style={{
                    transition: 'background-color 0.5s ease',
                    backgroundColor: isHighlighted ? '#cce5ff' : 'transparent',
                  }}
                >
                  <td data-label="전체 진행률">{overallProgress.toFixed(1)}%</td>
                  <td data-label="바코드">{item.barcode}</td>
                  <td data-label="입고 처리 현황">{status}</td>
                  <td data-label="스캔 시간">{item.timestamp}</td>
                  <td data-label="SKU">{item.sku}</td>
                  <td data-label="예상 수량">{item.expectedQuantity}</td>
                  <td data-label="실제 수량">{item.actualQuantity}</td>
                  <td data-label="진행률">{progress.toFixed(1)}%</td>
                  <td data-label="상태">{status}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
});

export default DataTable;