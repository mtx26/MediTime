import React, { useContext, useState, useEffect } from 'react';
import { UserContext, getGlobalReloadUser } from '../../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase/supabaseClient';
import { log } from '../../utils/logger';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/files/cropImage';
import { updateUserInfo } from '../../services/auth/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Pencil, Check, X } from 'lucide-react';

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
          alert(t('account.image_size_error'));
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
      <div>
        <h2 className="mb-4 text-2xl font-bold">{t('settings.account')}</h2>
        <p className="text-muted-foreground mb-4">{t('account.instructions')}</p>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex items-center gap-4">
            <button
              className="relative inline-block rounded-full overflow-hidden m-0 p-0 border-0"
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
                className="w-full h-full rounded-full"
                style={{ objectFit: 'cover' }}
              />

              {showOverlay && (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-content bg-black/75">
                  <Pencil className="w-8 h-8 text-white mx-auto" />
                </div>
              )}
            </button>

            <div className="flex-1 space-y-2">
              <Label htmlFor="displayName ">
                {t('account.display_name.label')}
              </Label>
              <Input
                type="text"
                id="displayName"
                placeholder={t('account.display_name.placeholder')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </div>
          
          {isModified && (
            <div className="flex gap-2 justify-end">
              <Button type="submit" variant="outline" className="gap-2">
                <Check className="w-4 h-4" /> {t('account.save_changes')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setDisplayName(userInfo?.displayName);
                  setPreviewURL(userInfo?.photoUrl);
                  setIsModified(false);
                }}
              >
                <X className="w-4 h-4" /> {t('cancel')}
              </Button>
            </div>
          )}
        </form>
      </div>
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('account.crop.title')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('account.crop.title')}
            </DialogDescription>
          </DialogHeader>
          <div
            className="relative"
            style={{ height: '400px' }}
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
          <DialogFooter className="flex-col sm:flex-row gap-4">
            <div className="flex-1 max-w-xs">
              <Slider
                min={1}
                max={3}
                step={0.1}
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
              />
            </div>
            <Button onClick={handleCropConfirm}>
              {t('account.crop.use')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
