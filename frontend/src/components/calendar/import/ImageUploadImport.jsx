import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../../../contexts/AlertContext';

const ImageUploadImport = forwardRef(({ calendarName, personalCalendars, onStateChange }, ref) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lng } = useParams();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showAlert } = useAlert();
  const fileInputRef = useRef(null);

  // Fonction pour valider une URL de prévisualisation d'image
  const isValidImagePreviewUrl = (url) => {
    if (!url) return false;
    // Vérifier strictement que l'URL est un blob URL créé par createObjectURL
    // et provient de l'origine actuelle
    if (!url.startsWith('blob:') || !url.includes(window.location.origin)) {
      return false;
    }
    
    // Vérifier que l'URL ne contient pas de caractères suspects
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'blob:';
    } catch {
      return false;
    }
  };

  // Fonction pour valider strictement le type de fichier
  const isValidImageFile = (file) => {
    if (!file) return false;
    
    // Liste blanche des types MIME acceptés
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    
    // Vérifier le type MIME
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return false;
    }
    
    // Vérifier l'extension du fichier
    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    return hasValidExtension;
  };

  useEffect(() => {
    if (file) {
      // Valider strictement que le fichier est bien une image
      if (isValidImageFile(file)) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } else {
        setPreviewUrl(null);
        setFile(null);
        showAlert('warning', t('image_upload.file_type_error'));
      }
    } else {
      setPreviewUrl(null);
    }
  }, [file, showAlert, t]);

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
    if (droppedFile && isValidImageFile(droppedFile)) {
      setFile(droppedFile);
    } else {
      showAlert('warning', t('image_upload.file_type_error'));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && isValidImageFile(selectedFile)) {
      setFile(selectedFile);
    } else {
      showAlert('warning', t('image_upload.file_type_error'));
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
    e.preventDefault();
    
    if (!file) {
      showAlert('warning', t('image_upload.select_file_error'));
      return;
    }

    if (!calendarName.trim()) {
      showAlert('danger', t('calendar.error_no_calendar_name'));
      return;
    }

    setIsProcessing(true);

    try {
      const analysisResult = await personalCalendars.analyzeImage(file);
      
      if (analysisResult.success) {
        if (analysisResult.medicines && analysisResult.medicines.length > 0) {
          navigate(`/${lng}/add-calendar/review`, {
            state: { 
              importedMedicines: analysisResult.medicines,
              calendarName: calendarName 
            },
          });
        } else {
          showAlert('info', t('image_upload.no_medicines_found'));
        }
      } else {
        showAlert('danger', analysisResult.error || t('image_upload.analysis_error'));
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse de l\'image:', error);
      showAlert('danger', t('image_upload.file_analysis_error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="row">
      <hr/>
      <div className="col-12">
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
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={() => {
                          // En cas d'erreur de chargement, supprimer la prévisualisation
                          setPreviewUrl(null);
                          setFile(null);
                          showAlert('warning', t('image_upload.preview_error'));
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
