import React from 'react';
import * as XLSX from 'xlsx';

const FileHandler = React.memo(({ onUpload, onExport }) => {
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('파싱된 데이터:', jsonData);

        const parsedData = jsonData
          .filter((row) => row['Styles NO'] && row['Color'])
          .reduce((acc, row) => {
            const styleNo = row['Styles NO'];
            const color = row['Color'];
            const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

            sizes.forEach((size) => {
              const quantity = parseFloat(row[size] || 0);
              if (quantity > 0) {
                const sku = `${styleNo}-${color}-${size}`;
                if (!acc[sku]) {
                  acc[sku] = {
                    sku,
                    styleNo,
                    color,
                    size,
                    expectedQuantity: 0,
                    actualQuantity: 0,
                  };
                }
                acc[sku].expectedQuantity += quantity;
              }
            });

            return acc;
          }, {});

        const skuList = Object.values(parsedData);
        console.log('처리된 SKU 데이터:', skuList);
        onUpload(skuList);
      };
      reader.onerror = (error) => {
        console.error('파일 읽기 에러:', error);
        alert('파일 읽기 중 오류가 발생했습니다. 파일 형식을 확인해 주세요.');
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="d-flex justify-content-start">
      <label className="btn btn-primary me-2">
        입고 예정 업로드
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
      </label>
      <button className="btn btn-warning" onClick={onExport}>
        엑셀 내보내기
      </button>
    </div>
  );
});

export default FileHandler;