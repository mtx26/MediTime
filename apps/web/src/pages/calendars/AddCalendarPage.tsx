import { useTranslation } from 'react-i18next';
import QRScanImport from '@/components/calendar/import/QRScanImport';
import ImageUploadImport from '@/components/calendar/import/ImageUploadImport';
import { useAddCalendar } from '@/hooks/calendars/useAddCalendar';
import {
  ADD_CALENDAR_IMPORT_TYPES,
  DATAMATRIX_PREVIEW_MAX_HEIGHT_PX,
} from '@meditime/constants';
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
import type { AddCalendarPageProps } from '@meditime/types';

function AddCalendarPage(props: AddCalendarPageProps) {
  const { t } = useTranslation();
  const {
    personalCalendars,
    newCalendarName, setNewCalendarName,
    importType, setImportType,
    imageImportState, setImageImportState,
    qrScanState, setQrScanState,
    imageImportRef, qrScanRef,
    handleSubmit,
  } = useAddCalendar(props);

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
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
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
                <Select value={importType} onValueChange={(v) => setImportType(v as typeof importType)}>
                  <SelectTrigger id="importType" className="mt-2 w-full" data-tour="import-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ADD_CALENDAR_IMPORT_TYPES.MANUAL}>{t('calendar.import_type_manual')}</SelectItem>
                    <SelectItem value={ADD_CALENDAR_IMPORT_TYPES.QR}>{t('calendar.scan_qr_option')}</SelectItem>
                    <SelectItem value={ADD_CALENDAR_IMPORT_TYPES.FILE}>{t('calendar.import_type_file')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {importType === ADD_CALENDAR_IMPORT_TYPES.MANUAL && (
              <div>
                <div className="mb-6">
                  <Button type="submit" size="lg" className="gap-2 w-full" data-tour="submit-calendar-btn">
                    <Plus className="h-5 w-5" />
                    {t('add')}
                  </Button>
                </div>
                <Alert>
                  <AlertCircle className="h-5 w-5" />
                  <div className="ml-4">
                    <strong>{t('calendar.import_type_manual')}</strong>
                    <AlertDescription className="mt-1">{t('calendar.import_type_manual_description')}</AlertDescription>
                  </div>
                </Alert>
              </div>
            )}

            {importType === ADD_CALENDAR_IMPORT_TYPES.QR && (
              <>
                <QRScanImport
                  ref={qrScanRef}
                  calendarName={newCalendarName}
                  personalCalendars={personalCalendars}
                  onStateChange={setQrScanState}
                />
                <div className="my-6">
                  <Button type="submit" size="lg" className="gap-2 w-full" disabled={!qrScanState.hasMedicine}>
                    <QrCode className="h-5 w-5" />
                    {t('add')}
                  </Button>
                </div>
                <Alert>
                  <CheckCircle className="h-5 w-5" />
                  <div className="ml-4">
                    <strong>{t('calendar.scan_qr_option')}</strong>
                    <AlertDescription className="mt-1">{t('calendar.import_type_qr_description')}</AlertDescription>
                    <div className="mt-4 text-center">
                      <img
                        src="/icons/datamatrix.webp"
                        alt="Data Matrix QR Code"
                        className="mx-auto"
                        style={{ maxHeight: `${DATAMATRIX_PREVIEW_MAX_HEIGHT_PX}px` }}
                      />
                    </div>
                  </div>
                </Alert>
              </>
            )}

            {importType === ADD_CALENDAR_IMPORT_TYPES.FILE && (
              <>
                <ImageUploadImport
                  ref={imageImportRef}
                  calendarName={newCalendarName}
                  personalCalendars={personalCalendars}
                  onStateChange={setImageImportState}
                />
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
                <Alert>
                  <AlertTriangle className="h-5 w-5" />
                  <div className="ml-4">
                    <strong>{t('calendar.import_type_file')}</strong>
                    <AlertDescription className="mt-1">{t('calendar.import_type_file_description')}</AlertDescription>
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
