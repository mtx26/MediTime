import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QRScanImport from '@/components/calendar/import/QRScanImport';
import ImageUploadImport from '@/components/calendar/import/ImageUploadImport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarPlus, Plus, QrCode, Upload, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

function AddCalendarPage({ personalCalendars }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lng } = useParams();

  const [newCalendarName, setNewCalendarName] = useState('');
  const [importType, setImportType] = useState('manual');
  
  // Refs pour les composants d'import
  const imageImportRef = useRef(null);
  const qrScanRef = useRef(null);
  
  // State pour l'état du composant d'import d'image
  const [imageImportState, setImageImportState] = useState({
    hasFile: false,
    isProcessing: false
  });

  const [qrScanState, setQrScanState] = useState({
    hasMedicine: false
  });

  const handleSubmit = async () => {
    if (importType === 'manual') {
      const rep = await personalCalendars.addCalendar(newCalendarName);
      if (rep.success) {
        navigate(`/${lng}/calendar/${rep.calendarId}/boxes`);
      }
    } else if (importType === 'qr' && qrScanRef.current) {
      qrScanRef.current.handleAddAll();
    } else if (importType === 'file' && imageImportRef.current) {
      imageImportRef.current.handleImport();
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center border-b">
          <div className="flex justify-center mb-3">
            <CalendarPlus className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('calendar.add_calendar')}</CardTitle>
        </CardHeader>

        <CardContent className="py-8">
          {/* Form principal pour le nom du calendrier - toujours visible */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="newCalendarName">
                  {t('calendar.name')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="newCalendarName"
                  type="text"
                  placeholder={t('calendar.name')}
                  required
                  value={newCalendarName}
                  onChange={(e) => setNewCalendarName(e.target.value)}
                  data-tour="calendar-name-input"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="importType">
                  {t('calendar.import_type')} <span className="text-destructive">*</span>
                </Label>
                <Select value={importType} onValueChange={setImportType}>
                  <SelectTrigger id="importType" className="mt-2 w-full" data-tour="import-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">{t('calendar.import_type_manual')}</SelectItem>
                    <SelectItem value="qr">{t('calendar.scan_qr_option')}</SelectItem>
                    <SelectItem value="file">{t('calendar.import_type_file')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mode manuel */}
            {importType === 'manual' && (
              <div>
                <div className="mb-6">
                  <Button
                    type="submit"
                    size="lg"
                    className="gap-2 w-full"
                    data-tour="submit-calendar-btn"
                  >
                    <Plus className="h-5 w-5" />
                    {t('add')}
                  </Button>
                </div>

                <Alert>
                  <AlertCircle className="h-5 w-5" />
                  <div className="ml-4">
                    <strong>{t('calendar.import_type_manual')}</strong>
                    <AlertDescription className="mt-1">
                      {t('calendar.import_type_manual_description')}
                    </AlertDescription>
                  </div>
                </Alert>
              </div>
            )}

            {/* Composants d'import pour QR et fichier */}
            {importType === 'qr' && (
              <>
                <QRScanImport
                  ref={qrScanRef}
                  calendarName={newCalendarName}
                  personalCalendars={personalCalendars}
                  onStateChange={setQrScanState}
                />
                
                {/* Bouton pour créer le calendrier avec les médicaments scannés */}
                <div className="my-6">
                  <Button
                    type="submit"
                    size="lg"
                    className="gap-2 w-full"
                    disabled={!qrScanState.hasMedicine}
                  >
                    <QrCode className="h-5 w-5" />
                    {t('add')}
                  </Button>
                </div>
                
                {/* Alert explicative en dessous */}
                <Alert>
                  <CheckCircle className="h-5 w-5" />
                  <div className="ml-4">
                    <strong>{t('calendar.scan_qr_option')}</strong>
                    <AlertDescription className="mt-1">
                      {t('calendar.import_type_qr_description')}
                    </AlertDescription>
                    <div className="mt-4 text-center">
                      <img 
                        src="/icons/datamatrix.webp" 
                        alt="Data Matrix QR Code" 
                        className="mx-auto"
                        style={{ maxHeight: '160px' }}
                      />
                    </div>
                  </div>
                </Alert>
              </>
            )}

            {importType === 'file' && (
              <>
                <ImageUploadImport
                  ref={imageImportRef}
                  calendarName={newCalendarName}
                  personalCalendars={personalCalendars}
                  onStateChange={setImageImportState}
                />
                
                {/* Bouton d'import pour les fichiers */}
                <div className="my-6">
                  <Button
                    type="submit"
                    size="lg"
                    className="gap-2 w-full"
                    disabled={!imageImportState.hasFile || imageImportState.isProcessing}
                  >
                    <Upload className="h-5 w-5" />
                    {t('add')}
                  </Button>
                </div>

                {/* Alert explicative en dessous */}
                <Alert>
                  <AlertTriangle className="h-5 w-5" />
                  <div className="ml-4">
                    <strong>{t('calendar.import_type_file')}</strong>
                    <AlertDescription className="mt-1">
                      {t('calendar.import_type_file_description')}
                    </AlertDescription>
                  </div>
                </Alert>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default AddCalendarPage;
