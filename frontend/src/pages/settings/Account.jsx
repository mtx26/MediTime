import React, { useContext, useState, useEffect } from 'react';
import { UserContext, getGlobalReloadUser } from '../../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase/supabaseClient';
import { log } from '../../utils/logger';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/files/cropImage';
import { updateUserInfo } from '../../services/auth/authService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Pencil, Check, X, User, Camera, UserCircle } from 'lucide-react';
import { toast } from 'sonner';

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
    try {
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

      if (response.ok) {
        const reloadUser = getGlobalReloadUser();
        reloadUser();
        
        toast.success(t('account.photo_updated'));
        
        log.info(data.message, {
          origin: 'USER_PHOTO',
          code: 'PHOTO_UPLOAD_SUCCESS',
          uid: userInfo.uid,
        });
      } else {
        toast.error(t('account.photo_error'));
      }
    } catch (error) {
      toast.error(t('account.photo_error'));
      log.error('Error uploading photo', {
        origin: 'USER_PHOTO',
        code: 'PHOTO_UPLOAD_ERROR',
        error: error.message,
      });
    }
  };

  const handleCropConfirm = async () => {
    const croppedImage = await getCroppedImg(rawImage, croppedAreaPixels);
    setPreviewURL(croppedImage); 
    const blob = await fetch(croppedImage).then((r) => r.blob());
    setShowCropModal(false);
    await uploadPhoto(blob);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (displayName !== userInfo?.displayName) {
      try {
        await updateUserInfo({
          display_name: displayName,
          uid
        });
        toast.success(t('account.profile_updated'));
      } catch (error) {
        toast.error(t('account.profile_error'));
        log.error('Error updating profile', {
          origin: 'USER_PROFILE',
          code: 'PROFILE_UPDATE_ERROR',
          error: error.message,
        });
        return;
      }
    }
    setIsModified(false);
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
          toast.error(t('account.image_size_error'));
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
      <div className="max-w-4xl mx-auto space-y-8 pb-8">
        {/* En-tête */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t('settings.account')}</h2>
          <p className="text-muted-foreground">{t('account.instructions')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section Photo de profil */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <CardTitle>{t('account.profile_photo.title')}</CardTitle>
              </div>
              <CardDescription>{t('account.profile_photo.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 border rounded-lg bg-accent/20">
                <button
                  className="relative rounded-full overflow-hidden border-4 border-background shadow-lg hover:shadow-xl transition-shadow"
                  style={{ width: '120px', height: '120px', cursor: 'pointer' }}
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
                    className="w-full h-full"
                    style={{ objectFit: 'cover' }}
                  />

                  {showOverlay && (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/60 backdrop-blur-sm">
                      <div className="text-center text-white">
                        <Pencil className="w-8 h-8 mx-auto mb-1" />
                        <span className="text-xs font-medium">{t('account.change_photo')}</span>
                      </div>
                    </div>
                  )}
                </button>

                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm font-medium mb-1">{t('account.profile_photo.hint')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('account.profile_photo.size_limit')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Informations personnelles */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" />
                <CardTitle>{t('account.personal_info.title')}</CardTitle>
              </div>
              <CardDescription>{t('account.personal_info.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium">
                  {t('account.display_name.label')}
                </Label>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-lg border">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <Input
                    type="text"
                    id="displayName"
                    placeholder={t('account.display_name.placeholder')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('account.display_name.hint')}
                </p>
              </div>

              {isModified && (
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button type="submit" className="gap-2">
                    <Check className="w-4 h-4" /> {t('account.save_changes')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setDisplayName(userInfo?.displayName);
                      setIsModified(false);
                    }}
                  >
                    <X className="w-4 h-4" /> {t('cancel')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
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
