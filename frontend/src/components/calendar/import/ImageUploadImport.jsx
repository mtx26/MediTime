import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AlertSystem from '../../common/AlertSystem';

function ImageUploadImport({ calendarName, personalCalendars, onError }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lng } = useParams();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
    } else {
      setAlertMessage('Seuls les fichiers image sont acceptés (jpg, png, webp, gif).');
      setAlertType('warning');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setAlertMessage(''); // Clear any previous alert
    } else {
      setAlertMessage('Seuls les fichiers image sont acceptés (jpg, png, webp, gif).');
      setAlertType('warning');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleImport = async (e) => {
    e.preventDefault(); // Empêcher la soumission par défaut du formulaire
    
    if (!file) {
      setAlertMessage('Veuillez sélectionner un fichier image.');
      setAlertType('warning');
      return;
    }

    if (!calendarName.trim()) {
      onError('Le nom du calendrier est requis.');
      return;
    }

    setIsProcessing(true);
    setAlertMessage('');

    try {
      // Analyser l'image avec l'API personnalisée
      const analysisResult = await personalCalendars.analyzeImage(file);
      
      if (analysisResult.success) {
				console.log(analysisResult.medicines);
        if (analysisResult.medicines && analysisResult.medicines.length > 0) {
          // Rediriger vers la page de review avec les médicaments trouvés
          navigate(`/${lng}/add-calendar/review`, {
            state: { 
              importedMedicines: analysisResult.medicines,
              calendarName: calendarName 
            },
          });
        } else {
          setAlertMessage(t('calendar.no_medicines_found'));
          setAlertType('info');
        }
      } else {
        onError(analysisResult.error || t('calendar.image_analysis_error'));
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse de l\'image:', error);
      onError('Erreur lors de l\'analyse du fichier');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setAlertMessage(''); // Clear alerts when removing file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="row">
			<hr/>
      <div className="col-12">
        {alertMessage && (
          <AlertSystem 
            message={alertMessage}
            type={alertType}
            onClose={() => setAlertMessage('')}
          />
        )}

        <div>
          <div>
            <h5 className="mb-3 text-center">
              <i className="bi bi-cloud-upload me-2"></i>
              Sélectionner et prévisualiser un fichier
            </h5>

            <div className="row">
              <div className="col-12">
                <div
                  className="border border-2 border-dashed rounded p-4 text-center bg-light"
                  style={{ minHeight: '200px', cursor: 'pointer' }}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
                    style={{ display: 'none' }}
                  />
                  
                  {previewUrl ? (
                    <div className="position-relative d-inline-block">
                      <img
                        src={previewUrl}
                        alt="Aperçu"
                        className="img-fluid rounded border shadow-sm mb-3"
                        style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                        onClick={(e) => {
                          e.stopPropagation(); // Empêcher le clic sur la zone de drop
                          removeFile();
                        }}
                        title="Supprimer l'image"
                      >
                        <i className="bi bi-x"></i>
                      </button>
                      <div className="mt-2">
                        <p className="mb-1 fw-semibold text-success">
                          <i className="bi bi-check-circle me-2"></i>
                          Fichier sélectionné
                        </p>
                        <small className="text-muted">Cliquez pour changer de fichier</small>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <i className="bi bi-cloud-upload display-4 text-muted mb-3"></i>
                      <p className="mb-1 fw-semibold">{t('calendar.drag_and_drop')}</p>
                      <small className="text-muted">JPG, PNG, WEBP, GIF</small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {file && (
              <div className="row mt-4">
                <div className="col-12 text-center">
                  <button
                    className="btn btn-primary btn-lg px-5"
                    onClick={handleImport}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">{t('calendar.processing')}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-upload me-2"></i>
                        {t('add')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alert explicative en dessous */}
        <div className="alert alert-warning mt-3">
          <div className="d-flex align-items-center">
            <i className="bi bi-info-circle me-3"></i>
            <div>
              <strong>{t('calendar.import_type_file')}</strong>
              <p className="mb-0 small mt-1">
                {t('calendar.import_type_file_description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageUploadImport;
