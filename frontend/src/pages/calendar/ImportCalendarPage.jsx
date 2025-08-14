import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AlertSystem from '../../components/common/AlertSystem';

export default function ImportCalendarPage({ personalCalendars }) {
  const location = useLocation();
  const { t } = useTranslation();
  const params = new URLSearchParams(location.search);
  const calendarName = params.get('name') || '';

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null); // <-- ref ici

  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');

  const navigate = useNavigate();
  const { lng } = useParams();

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
      alert('Seuls les fichiers image sont acceptés (jpg, png, webp, gif).');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
    } else {
      alert('Seuls les fichiers image sont acceptés (jpg, png, webp, gif).');
    }
  };

  const handleReset = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // <-- reset le champ fichier
    }
  };

  return (
    <div className={`container card p-0 shadow`} style={{ maxWidth: '600px' }}>
      <h4 className="mb-4 fw-bold text-center mt-4">
        <i className="bi bi-file-earmark-plus me-2"></i>
        {t('calendar.import_calendar', { name: calendarName })}
      </h4>

      <div
        className={`rounded p-3 text-center mx-auto`}
        style={{ maxWidth: '600px' }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <p className="mb-3 text-muted">{t('calendar.drag_and_drop')}</p>

        <input
          type="file"
          ref={fileInputRef} // <-- ici
          accept=".jpg,.jpeg,.png,.webp,.gif"
          className="d-none"
          id="fileUpload"
          onChange={handleFileChange}
        />
        <label htmlFor="fileUpload" className="btn btn-outline-primary">
          {t('calendar.choose_image')}
        </label>

        {file && (
          <>
            <div className="mt-4">
              <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap mb-3">
                <span className="fw-semibold text-secondary">{file.name}</span>
                <button
                  className="btn p-0 border-0 bg-transparent text-danger"
                  onClick={handleReset}
                  aria-label={t('title.delete_file')}
                  title={t('title.delete_file')}
                >
                  <i className="bi bi-x-circle fs-5"></i>
                </button>
              </div>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Aperçu"
                  className="img-thumbnail"
                  style={{ maxHeight: '200px', objectFit: 'contain' }}
                />
              )}
            </div>
            <AlertSystem
              type={alertType}
              message={alertMessage}
              onClose={() => setAlertMessage(null)}
            />
            <div className="text-center mt-4">
              <button 
                className="btn btn-primary px-4"
                onClick={async () => {
                  const rep = await personalCalendars.analyzeImage(file);
                  if (rep.success) {
                    if (rep.medicines) {
                      if (rep.medicines.length === 0) {
                        setAlertMessage(t('calendar.no_medicines_found'));
                        setAlertType('info');
                      }
                      navigate(`/${lng}/add-calendar/review`, {
                        state: { importedMedicines: rep.medicines },
                      });
                    } else {
                      setAlertMessage(t('calendar.image_analysis_error'));
                      setAlertType('danger');
                    }
                  } else {
                    setAlertMessage(t('calendar.image_analysis_error'));
                    setAlertType('danger');
                  }
                }}
                aria-label={t('next')}
                title={t('next')}
              >
                {t('next')}
                <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
