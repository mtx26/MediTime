import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import QRCodeScanner from "../../components/scanner/QRCodeScanner";

export default function ScannerPage() {
  const { t } = useTranslation();
  const [scannedMedicines, setScannedMedicines] = useState([]);

  const handleMedicineFound = ({ gtin, medicine, action }) => {
    console.log('Médicament détecté:', { gtin, medicine, action });
    
    if (action === 'select') {
      // L'utilisateur a sélectionné ce médicament
      alert(`Médicament sélectionné: ${medicine.name}`);
    } else {
      // Médicament trouvé automatiquement
      setScannedMedicines(prev => {
        const exists = prev.find(m => m.gtin === gtin);
        if (!exists) {
          return [...prev, { gtin, medicine, timestamp: new Date() }];
        }
        return prev;
      });
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h3 className="card-title mb-0">
                <i className="bi bi-qr-code-scan me-2"></i>
                Scanner de médicaments
              </h3>
              <p className="mb-0 mt-2">
                <i className="bi bi-info-circle me-2"></i>
                Pointez votre caméra vers le code DataMatrix sur l'emballage du médicament
              </p>
            </div>
            <div className="card-body">
              <QRCodeScanner onMedicineFound={handleMedicineFound} />
            </div>
          </div>

          {scannedMedicines.length > 0 && (
            <div className="card mt-4">
              <div className="card-header">
                <h4 className="card-title mb-0">
                  <i className="bi bi-list-check me-2"></i>
                  Historique des scans ({scannedMedicines.length})
                </h4>
              </div>
              <div className="card-body">
                <div className="row">
                  {scannedMedicines.map((item, index) => (
                    <div key={`${item.gtin}-${index}`} className="col-12 col-md-6 mb-3">
                      <div className="card h-100 border-success">
                        <div className="card-body">
                          <h6 className="card-title text-success">
                            {item.medicine?.name || 'Médicament inconnu'}
                          </h6>
                          <p className="card-text">
                            <small className="text-muted">
                              GTIN: <code>{item.gtin}</code>
                            </small>
                          </p>
                          {item.medicine?.dose && (
                            <p className="card-text">
                              <strong>Dose:</strong> {item.medicine.dose}
                            </p>
                          )}
                          {item.medicine?.conditionnement && (
                            <p className="card-text">
                              <strong>Conditionnement:</strong> {item.medicine.conditionnement}
                            </p>
                          )}
                          <small className="text-muted">
                            Scanné à {item.timestamp.toLocaleTimeString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => setScannedMedicines([])}
                  >
                    <i className="bi bi-trash me-2"></i>
                    Vider l'historique
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="card mt-4">
            <div className="card-header">
              <h4 className="card-title mb-0">
                <i className="bi bi-question-circle me-2"></i>
                Aide
              </h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Où trouver le code DataMatrix ?</h6>
                  <ul>
                    <li>Sur l'emballage extérieur du médicament</li>
                    <li>Généralement près du code-barres</li>
                    <li>C'est un petit carré noir et blanc</li>
                    <li>Peut être sur la boîte ou sur la notice</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>Conseils de scan :</h6>
                  <ul>
                    <li>Assurez-vous d'avoir un bon éclairage</li>
                    <li>Tenez l'appareil stable</li>
                    <li>Approchez ou éloignez selon la netteté</li>
                    <li>Le code doit être bien dans le cadre</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
