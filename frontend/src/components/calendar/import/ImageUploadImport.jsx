import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AlertSystem from '../../common/AlertSystem';

const ImageUploadImport = forwardRef(({ calendarName, personalCalendars, onStateChange }, ref) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lng } = useParams();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const fileInputRef = useRef(null);

  // Fonction pour valider une URL de prévisualisation d'image
  const isValidImagePreviewUrl = (url) => {
    if (!url) return false;
    // Vérifier que l'URL est un blob URL créé par createObjectURL
    return url.startsWith('blob:') && url.includes(window.location.origin);
  };

  useEffect(() => {
    if (file) {
      // Valider que le fichier est bien une image avant de créer l'URL
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        hasFile: !!file,
        isProcessing: isProcessing
      });
    }
  }, [file, isProcessing, onStateChange]);

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
    } else {
      setAlertMessage(t('image_upload.file_type_error'));
      setAlertType('warning');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setAlertMessage(''); // Clear any previous alert
    } else {
      setAlertMessage(t('image_upload.file_type_error'));
      setAlertType('warning');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Expose the import function to parent
  useImperativeHandle(ref, () => ({
    handleImport: () => handleImport(new Event('submit'))
  }));

  const handleImport = async (e) => {
    e.preventDefault(); // Empêcher la soumission par défaut du formulaire
    
    if (!file) {
      setAlertMessage(t('image_upload.select_file_error'));
      setAlertType('warning');
      return;
    }

    if (!calendarName.trim()) {
      setAlertMessage('❌ ' + t('calendar.error_no_calendar_name'));
      setAlertType('error');
      return;
    }

    setIsProcessing(true);
    setAlertMessage('');

    try {
      // Analyser l'image avec l'API personnalisée
      const analysisResult = await personalCalendars.analyzeImage(file);
      
      if (analysisResult.success) {
        if (analysisResult.medicines && analysisResult.medicines.length > 0) {
          // Rediriger vers la page de review avec les médicaments trouvés
          navigate(`/${lng}/add-calendar/review`, {
            state: { 
              importedMedicines: analysisResult.medicines,
              calendarName: calendarName 
            },
          });
        } else {
          setAlertMessage(t('image_upload.no_medicines_found'));
          setAlertType('info');
        }
      } else {
        setAlertMessage(analysisResult.error || t('image_upload.analysis_error'));
        setAlertType('danger');
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse de l\'image:', error);
      setAlertMessage(t('image_upload.file_analysis_error'));
      setAlertType('danger');
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
              {t('image_upload.title')}
            </h5>

            <div className="row">
              <div className="col-12">
                <div
                  className="border border-2 border-dashed rounded p-4 text-center bg-light"
                  style={{ minHeight: '200px', cursor: 'pointer' }}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={t('image_upload.click_to_select_file')}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
                    style={{ display: 'none' }}
                  />
                  
                  {previewUrl && isValidImagePreviewUrl(previewUrl) ? (
                    <div className="position-relative d-inline-block">
                      <img
                        src={previewUrl}
                        alt={t('image_upload.preview_alt')}
                        className="img-fluid rounded border shadow-sm mb-3"
                        style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'cover' }}
                        onError={() => {
                          // En cas d'erreur de chargement, supprimer la prévisualisation
                          setPreviewUrl(null);
                          setFile(null);
                          setAlertMessage(t('image_upload.preview_error'));
                          setAlertType('warning');
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                        onClick={(e) => {
                          e.stopPropagation(); // Empêcher le clic sur la zone de drop
                          removeFile();
                        }}
                        title={t('image_upload.remove_image')}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                      <div className="mt-2">
                        <p className="mb-1 fw-semibold text-success">
                          <i className="bi bi-check-circle me-2"></i>
                          {t('image_upload.file_selected')}
                        </p>
                        <small className="text-muted">{t('image_upload.click_to_change')}</small>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <i className="bi bi-cloud-upload display-4 text-muted mb-3"></i>
                      <p className="mb-1 fw-semibold">{t('calendar.drag_and_drop')}</p>
                      <small className="text-muted">{t('image_upload.file_types')}</small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton déplacé vers le parent - AddCalendarPage */}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ImageUploadImport;
