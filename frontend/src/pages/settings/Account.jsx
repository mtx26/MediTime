import React, { useContext, useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { UserContext, getGlobalReloadUser } from '../../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase/supabaseClient';
import { log } from '../../utils/logger';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/files/cropImage';
import { updateUserInfo } from '../../services/auth/authService';
import AlertSystem from '../../components/common/AlertSystem';

const API_URL = import.meta.env.VITE_API_URL;

export default function Account() {
  const { t } = useTranslation();
  const { userInfo } = useContext(UserContext);
  const uid = userInfo?.uid ?? null;

  const [displayName, setDisplayName] = useState(userInfo?.displayName || '');
  const [showOverlay, setShowOverlay] = useState(false);
  const [previewURL, setPreviewURL] = useState(
    userInfo?.photoUrl ||
      'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg'
  );
  const [photoFile, setPhotoFile] = useState(null);
  const [isModified, setIsModified] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [rawImage, setRawImage] = useState(null);
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => {
    if (displayName !== userInfo?.displayName) {
      setIsModified(true);
    } else {
      setIsModified(false);
    }
  }, [displayName, userInfo?.displayName]);

  const uploadPhoto = async (file) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const formData = new FormData();
    formData.append('photo', file);
    const response = await fetch(`${API_URL}/api/user/photo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });
    const data = await response.json();

    const reloadUser = getGlobalReloadUser();
    reloadUser();
    
    log.info(data.message, {
      origin: 'USER_PHOTO',
      code: 'PHOTO_UPLOAD_SUCCESS',
      uid: userInfo.uid,
    });
  };

  const handleCropConfirm = async () => {
    const croppedImage = await getCroppedImg(rawImage, croppedAreaPixels);
    setPreviewURL(croppedImage);
    setPhotoFile(await fetch(croppedImage).then((r) => r.blob()));
    setShowCropModal(false);
    setIsModified(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photoFile) {
      await uploadPhoto(photoFile);
    }
    if (displayName !== userInfo?.displayName) {
      const rep = await updateUserInfo({
        display_name: displayName,
        uid
      });
    }
    setIsModified(false);
    setPhotoFile(null);
  };

  const openFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const maxSize = 1024 * 1024 * 5; // 5MB
        if (file.size > maxSize) {
          setAlert({ type: 'danger', message: 'account.image_size_error' });
          return;
        }
        const imageURL = URL.createObjectURL(file);
        setRawImage(imageURL);
        setShowCropModal(true); // ouvre l’éditeur
      }
    };
    input.click();
  };

  useEffect(() => {
    return () => {
      if (previewURL?.startsWith('blob:')) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  return (
    <>
      {alert.message && (
        <AlertSystem
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      )}
      <div>
        <h2 className="mb-4">{t('settings.account')}</h2>
        <p className="text-muted mb-4">{t('account.instructions')}</p>

        <form className="row gap-3 align-items-center" onSubmit={handleSubmit}>
          <button
            className="position-relative d-inline-block rounded-circle overflow-hidden m-0 p-0 border-0"
            style={{ width: '100px', height: '100px', cursor: 'pointer' }}
            type="button"
            onClick={() => {
              setShowOverlay(!showOverlay);
              if (showOverlay) {
                openFilePicker();
              }
            }}
            onMouseEnter={() => setShowOverlay(true)}
            onMouseLeave={() => setShowOverlay(false)}
            onBlur={() => setShowOverlay(false)}
          >
            <img
              src={previewURL}
              alt={t('account.profile_alt')}
              className="w-100 h-100 rounded-circle"
              style={{ objectFit: 'cover' }}
            />

            {showOverlay && (
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75">
                <i className="bi bi-pencil text-white fs-3"></i>
              </div>
            )}
          </button>

          <div className="col">
            <label htmlFor="displayName" className="form-label">
              {t('account.display_name.label')}
            </label>
            <input
              type="text"
              id="displayName"
              className="form-control"
              placeholder={t('account.display_name.placeholder')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          {isModified && (
            <div className="d-flex gap-2 justify-content-end">
              <button type="submit" className="btn btn-outline-primary">
                <i className="bi bi-check-lg"></i> {t('account.save_changes')}
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => {
                  setDisplayName(userInfo?.displayName);
                  setPreviewURL(userInfo?.photoUrl);
                  setIsModified(false);
                }}
              >
                <i className="bi bi-x-lg"></i> {t('cancel')}
              </button>
            </div>
          )}
        </form>
      </div>
      <Dialog.Root open={showCropModal} onOpenChange={setShowCropModal}>
        <Dialog.Portal>
          <Dialog.Overlay 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{ zIndex: 1050 }}
          />
          <Dialog.Content
            className="modal-dialog modal-dialog-centered modal-lg position-fixed top-50 start-50 translate-middle"
            style={{ zIndex: 1051, maxWidth: '800px', width: '90%' }}
          >
            <div className="modal-content bg-white">
              <div className="modal-header">
                <Dialog.Title className="modal-title">{t('account.crop.title')}</Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="btn-close"
                  ></button>
                </Dialog.Close>
              </div>
              <div
                className="modal-body"
                style={{ height: '400px', position: 'relative' }}
              >
                <Cropper
                  image={rawImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) =>
                    setCroppedAreaPixels(croppedPixels)
                  }
                />
              </div>
              <div className="modal-footer">
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(e.target.value)}
                  className="form-range w-50"
                />
                <button className="btn btn-primary" onClick={handleCropConfirm}>
                  {t('account.crop.use')}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
