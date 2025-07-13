import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function ImportCalendarPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const calendarName = params.get('name') || '';

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null); // <-- ref ici

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
    setDragOver(false);
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
    <div className="container my-5">
      <h4 className="mb-4 fw-bold text-center">
        <i className="bi bi-file-earmark-plus me-2"></i>
        Importer le calendrier "<span>{calendarName}</span>"
      </h4>

      <div
        className={`border rounded p-5 text-center mx-auto ${dragOver ? 'bg-light border-primary' : 'border-secondary'} border-2 border-dashed`}
        style={{ maxWidth: '600px' }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <p className="mb-3 text-muted">Glissez une image ici ou cliquez pour la sélectionner</p>

        <input
          type="file"
          ref={fileInputRef} // <-- ici
          accept=".jpg,.jpeg,.png,.webp,.gif"
          className="d-none"
          id="fileUpload"
          onChange={handleFileChange}
        />
        <label htmlFor="fileUpload" className="btn btn-outline-primary">
          Choisir une image
        </label>

        {file && (
          <>
            <div className="mt-4">
              <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap mb-3">
                <span className="fw-semibold text-secondary">{file.name}</span>
                <button
                  className="btn p-0 border-0 bg-transparent text-danger"
                  onClick={handleReset}
                  aria-label="Supprimer le fichier"
                  title="Supprimer le fichier"
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
            <div className="text-center mt-4">
              <button className="btn btn-primary px-4">
                Suivant <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
