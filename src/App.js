import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import BarcodeInput from './components/BarcodeInput';
import DataTable from './components/DataTable';
import FileHandler from './components/FileHandler';
import * as XLSX from 'xlsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [scannedData, setScannedData] = useState([]);
  const [skuData, setSkuData] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastScannedSku, setLastScannedSku] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  // successSound와 errorSound를 useMemo로 메모이제이션
  const successSound = useMemo(() => new Audio('/success.mp3'), []);
  const errorSound = useMemo(() => new Audio('/error.mp3'), []);

  const playSound = useCallback((sound) => {
    sound.play().catch((error) => {
      console.error('사운드 재생 오류:', error);
      toast.error('사운드 재생에 실패했습니다. 사운드 파일을 확인해 주세요.');
    });
  }, []);

  useEffect(() => {
    const savedScannedData = localStorage.getItem('scannedData');
    const savedSkuData = localStorage.getItem('skuData');
    if (savedScannedData) {
      setScannedData(JSON.parse(savedScannedData));
    }
    if (savedSkuData) {
      setSkuData(JSON.parse(savedSkuData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('scannedData', JSON.stringify(scannedData));
    localStorage.setItem('skuData', JSON.stringify(skuData));
  }, [scannedData, skuData]);

  const handleUpload = useCallback((parsedSkuData) => {
    console.log('업로드된 SKU 데이터:', parsedSkuData);
    setSkuData(parsedSkuData);
    toast.success('입고 예정 데이터가 성공적으로 업로드되었습니다!');
    playSound(successSound);
  }, [playSound, successSound]);

  const handleScan = useCallback((barcode) => {
    if (!barcode || typeof barcode !== 'string') {
      toast.error('유효하지 않은 바코드입니다.');
      playSound(errorSound);
      return;
    }

    const parts = barcode.split('/');
    if (parts.length !== 3) {
      toast.error('바코드 형식이 올바르지 않습니다. 형식: STYLE/COLOR/SIZE');
      playSound(errorSound);
      return;
    }

    const [styleNo, color, size] = parts;
    const sku = `${styleNo}-${color}-${size}`;

    const matchedSku = skuData.find((item) => item.sku === sku);
    if (!matchedSku) {
      toast.error('일치하는 SKU가 없습니다.');
      playSound(errorSound);
      return;
    }

    if (lastScannedSku && lastScannedSku !== sku) {
      toast.error('새로운 SKU가 스캔되었습니다. 이전 SKU와 다릅니다.');
      playSound(errorSound);
    }

    const existingScan = scannedData.find((item) => item.sku === sku);
    if (existingScan) {
      setScannedData((prev) =>
        prev.map((item) =>
          item.sku === sku
            ? {
                ...item,
                actualQuantity: item.actualQuantity + 1,
                timestamp: new Date().toLocaleString(),
              }
            : item
        )
      );
    } else {
      const newData = {
        barcode,
        timestamp: new Date().toLocaleString(),
        sku,
        expectedQuantity: matchedSku.expectedQuantity,
        actualQuantity: 1,
      };
      setScannedData((prev) => [newData, ...prev]);
    }

    setSkuData((prev) =>
      prev.map((item) =>
        item.sku === sku
          ? { ...item, actualQuantity: item.actualQuantity + 1 }
          : item
      )
    );

    setLastScannedSku(sku);
    toast.success(`바코드 ${barcode} 스캔 성공!`);
    playSound(successSound);
  }, [scannedData, skuData, lastScannedSku, playSound, errorSound, successSound]);

  const calculateStats = useMemo(() => {
    const totalSkus = skuData ? skuData.length : 0;
    const expectedTotal = skuData ? skuData.reduce((sum, item) => sum + (item.expectedQuantity || 0), 0) : 0;
    const actualTotal = skuData ? skuData.reduce((sum, item) => sum + (item.actualQuantity || 0), 0) : 0;
    const overallProgress = expectedTotal > 0 ? (actualTotal / expectedTotal) * 100 : 0;

    return {
      totalSkus,
      expectedTotal,
      actualTotal,
      overallProgress,
    };
  }, [skuData]);

  const handleExport = useCallback(() => {
    const exportData = skuData.map((item) => {
      const progress = item.expectedQuantity > 0
        ? (item.actualQuantity / item.expectedQuantity) * 100
        : 0;
      const result = progress < 100 ? '부족' : progress === 100 ? '완료' : '초과';

      return {
        '스타일NO.': item.styleNo,
        '색상': item.color,
        '사이즈': item.size,
        '예정수량': item.expectedQuantity,
        '스캔수량': item.actualQuantity,
        '진행률': `${progress.toFixed(1)}%`,
        '결과': result,
      };
    });

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `${dateStr}_입고 스캔정보_${dateStr}.xlsx`;

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '검수 내역');
    XLSX.writeFile(workbook, fileName);

    toast.success('검수 내역이 엑셀로 내보내기되었습니다!');
    playSound(successSound);

    setScannedData([]);
    setSkuData(skuData.map((item) => ({ ...item, actualQuantity: 0 })));
    localStorage.removeItem('scannedData');
    localStorage.removeItem('skuData');
  }, [skuData, playSound, successSound]);

  const handleResetConfirm = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleFinalConfirm = useCallback(() => {
    setShowFinalConfirm(true);
  }, []);

  const handleReset = useCallback(() => {
    setScannedData([]);
    setSkuData(skuData.map((item) => ({ ...item, actualQuantity: 0 })));
    localStorage.removeItem('scannedData');
    localStorage.removeItem('skuData');
    toast.info('데이터가 초기화되었습니다.');
    playSound(successSound);
    setShowConfirm(false);
    setShowFinalConfirm(false);
  }, [skuData, playSound, successSound]);

  const { totalSkus, expectedTotal, actualTotal, overallProgress } = calculateStats;

  return (
    <div className="App">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <span className="navbar-brand px-5">코리아종합물류 KT_LOGIS</span>
          <div className="navbar-nav ms-auto">
            <span className="navbar-text text-white px-5">무신사 스탠다드 입고 관리</span>
          </div>
        </div>
      </nav>

      <div className="container mt-4 app-container">
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              대시보드
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'processing' ? 'active' : ''}`}
              onClick={() => setActiveTab('processing')}
            >
              입고 처리
            </button>
          </li>
        </ul>

        {activeTab === 'dashboard' && (
          <>
            <div className="card mb-4">
              <div className="card-body">
                <h5>입고 예정 정보 통계</h5>
                <div className="row justify-content-center">
                  <div className="col-6 col-md-3 mb-2">
                    <p>총 라인수수 : {totalSkus}</p>
                  </div>
                  <div className="col-6 col-md-3 mb-2">
                    <p>총 예정 수량: {expectedTotal}</p>
                  </div>
                  <div className="col-6 col-md-3 mb-2">
                    <p>실제 입고 수량: {actualTotal}</p>
                  </div>
                  <div className="col-6 col-md-3 mb-2">
                    <p>입고 완료율: {overallProgress.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h5>DATA IN / OUT / RESET</h5>
                <p>초기화시 되돌릴 수 없습니다. 주의해서 진행 해주세요.</p>
                <div className="d-flex justify-content-center align-items-center gap-3">
                  <FileHandler
                    scannedData={scannedData}
                    onUpload={handleUpload}
                    onExport={handleExport}
                  />
                  <button
                    className="btn btn-danger"
                    onClick={handleResetConfirm}
                  >
                    RESET
                  </button>
                </div>

                {showConfirm && (
                  <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">데이터 초기화 확인</h5>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowConfirm(false)}
                          ></button>
                        </div>
                        <div className="modal-body">
                          <p>정말로 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
                        </div>
                        <div className="modal-footer">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowConfirm(false)}
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={handleFinalConfirm}
                          >
                            확인
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showFinalConfirm && (
                  <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">최종 확인</h5>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowFinalConfirm(false)}
                          ></button>
                        </div>
                        <div className="modal-body">
                          <p>마지막으로 확인합니다. 데이터를 초기화하시겠습니까?</p>
                        </div>
                        <div className="modal-footer">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowFinalConfirm(false)}
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={handleReset}
                          >
                            초기화
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'processing' && (
          <>
            <div className="card mb-4">
              <div className="card-body">
                <BarcodeInput onScan={handleScan} />
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-body">
                <DataTable
                  scannedData={scannedData}
                  overallProgress={overallProgress}
                  lastScannedSku={lastScannedSku}
                  setLastScannedSku={setLastScannedSku}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
}

export default App;