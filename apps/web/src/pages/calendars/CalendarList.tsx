import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLoading } from '@/components/ui/loading';
import HoveredUserProfile from '@/components/common/HoveredUserProfile';
import ActionSheet from '@/components/common/ActionSheet';
import { useTranslation } from 'react-i18next';
import { useAlert } from '@/contexts/AlertContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar, Users, Pencil, Download, AlertTriangle, Plus, X, Info } from 'lucide-react';
import { buildPersonalCalendarActions, buildSharedCalendarActions } from '@meditime/utils';
import { toActionSheetItems } from '@/utils/actionSheetAdapter';
import StatusBadge from '@/components/common/StatusBadge';
import type { CheckedState } from '@radix-ui/react-checkbox';
import type { CalendarListItem, CalendarListPageProps } from '@meditime/types';


function SelectCalendar({
  personalCalendars,
  sharedUserCalendars
}: CalendarListPageProps) {
  const { lng } = useParams();
  const { t } = useTranslation();
  const { showConfirm } = useAlert();

  // 📅 Gestion des calendriers
  const [renameValues, setRenameValues] = useState<Record<string, string>>({}); // État pour les valeurs de renommage de calendrier
  const [renameMode, setRenameMode] = useState<string | null>(null); // État pour le mode de renommage

  // 📄 Export PDF
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfCalendarId, setPdfCalendarId] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const openPdfDialog = (calendarId: string) => {
    setPdfCalendarId(calendarId);
    setIncludeInactive(false);
    setPdfDialogOpen(true);
  };

  const handleDownloadPdf = () => {
    if (pdfCalendarId) {
      personalCalendars.downloadPersonalCalendarPdf(pdfCalendarId, includeInactive);
    }
    setPdfDialogOpen(false);
  };

  const renameConfirmAction = async (calendarId: string) => {
    const rep = await personalCalendars.renameCalendar(
      calendarId,
      renameValues[String(calendarId)]
    );
    if (rep.success) {
      setRenameValues((prev) => ({ ...prev, [String(calendarId)]: '' }));
    }
  };

  // 🔄 Renommage d'un calendrier
  const handleRenameClick = (calendarId: string) => {
    showConfirm(
      'confirm-safe',
      t('calendar.rename_title'),
      t('calendar.rename_description'),
      () => renameConfirmAction(calendarId)
    );
  };

  const deleteConfirmAction = async (calendarId: string) => {
    await personalCalendars.deleteCalendar(calendarId);
  };

  const handleDeleteCalendarClick = (calendarId: string) => {
    showConfirm(
      'confirm-danger',
      t('calendar.delete_title'),
      t('calendar.delete_description'),
      () => deleteConfirmAction(calendarId)
    );
  };

  const deleteSharedCalendarConfirmAction = async (calendarId: string) => {
    await sharedUserCalendars.deleteSharedCalendar(calendarId);
  };

  const handleDeleteSharedCalendarClick = (calendarId: string) => {
    showConfirm(
      'confirm-danger',
      t('calendar.delete_shared_title'),
      t('calendar.delete_shared_description'),
      () => deleteSharedCalendarConfirmAction(calendarId)
    );
  };

  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(personalCalendars.calendarsData === null, t('loading_calendars'));
  }, [personalCalendars.calendarsData, showLoading, t]);

  if (personalCalendars.calendarsData === null) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-6">

      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-6 w-6 text-primary" />
          <h4 className="text-xl font-bold">{t('my_calendars')}</h4>
        </div>

        {/* Liste des calendriers */}
        <div className="border rounded-lg overflow-hidden shadow">
          {(Array.isArray(personalCalendars.calendarsData) && personalCalendars.calendarsData.length > 0) && (
            personalCalendars.calendarsData.map((calendarData: CalendarListItem) => (
              <div key={calendarData.id} className="border-b last:border-b-0 p-3 hover:bg-accent/50 transition">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  {/* Partie gauche : Nom + nombre */}
                  <div className="grow">
                    <h5 className="font-semibold text-lg mb-1">{calendarData.name}</h5>
                    <div className="text-sm text-muted-foreground">
                      {t('medicines.label')}:
                      <span className="font-semibold ml-1">
                        {calendarData.boxes_count ?? '...'}
                      </span>
                    </div>
                  </div>

                  {/* Bouton Ouvrir */}
                  <Link to={`/${lng}/calendar/${calendarData.id}`}>
                    <Button variant="outline">
                      {t('open')}
                    </Button>
                  </Link>

                  {/* ActionSheet */}
                  <ActionSheet
                    actions={toActionSheetItems(
                      buildPersonalCalendarActions(
                        { calendarId: calendarData.id, lng: lng!, basePath: 'calendar', selectedDate: null },
                        {
                          onRename: () => setRenameMode(calendarData.id),
                          onDelete: () => handleDeleteCalendarClick(calendarData.id),
                          onExportPdf: () => openPdfDialog(calendarData.id),
                        },
                        ['pillbox', 'day_view'],
                      ),
                      t,
                    )}
                  />
                </div>
                {calendarData.ifLowStock && (
                  <Link to={`/${lng}/calendar/${calendarData.id}/stock-alerts`}>
                    <StatusBadge variant="warning" icon={AlertTriangle} text={t('stock_alert')} />
                  </Link>
                )}
                {/* afficher la form si on est en mode renommage */}
                {renameMode === calendarData.id && (
                  <div className="flex justify-center pt-3 border-t">
                    {/* Partie pour renommer un calendrier */}
                    <form
                      className="flex gap-2 w-full"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRenameClick(calendarData.id);
                        setRenameMode(null);
                      }}
                    >
                      <Input
                        id={'renameCalendarName' + calendarData.id}
                        aria-label={t('calendar.new_name')}
                        type="text"
                        placeholder={t('calendar.new_name')}
                        required
                        value={renameValues[String(calendarData.id)] || ''} // Valeur du champ de renommage
                        onChange={(e) =>
                          setRenameValues({
                            ...renameValues,
                            [String(calendarData.id)]: e.target.value,
                          })
                        } // Mise à jour de l'état
                        className="flex-1"
                      />
                      <Button
                        variant="default"
                        size="sm"
                        title={t('rename')}
                        type="submit"
                        aria-label={t('rename')}
                        className="gap-1"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        title={t('cancel')}
                        type="button"
                        aria-label={t('cancel')}
                        onClick={() => setRenameMode(null)}
                        className="gap-1"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            ))
          )}
          <Link
            to={`/${lng}/add-calendar`}
            data-tour="add-calendar-btn"
            className="flex items-center justify-center gap-2 px-2 py-2 text-primary hover:bg-accent/50 transition border-t"
          >
            <Plus className="h-4 w-4" />
            {t('calendar.add_calendar')}
          </Link>
        </div>
      </div>

      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-6 w-6 text-primary" />
          <h4 className="text-xl font-bold">{t('shared_calendars')}</h4>
        </div>

        {/* Liste des calendriers partagés */}
        {Array.isArray(sharedUserCalendars.sharedCalendarsData) &&
        sharedUserCalendars.sharedCalendarsData.length > 0 ? (
          <div className="border rounded-lg overflow-hidden shadow">
            {sharedUserCalendars.sharedCalendarsData.map(
              (calendarData: CalendarListItem) => (
                <div key={calendarData.id} className="border-b last:border-b-0 p-3 hover:bg-accent/50 transition">

                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="grow">
                      <h5 className="font-semibold text-lg mb-1">{calendarData.name}</h5>
                      <div className="text-sm text-muted-foreground">
                        {t('medicines.label')}:
                        <span className="font-semibold ml-1">
                          {calendarData.boxes_count ?? '...'}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <HoveredUserProfile
                          user={{
                            email: calendarData.owner_email,
                            display_name: calendarData.owner_name || '',
                            photo_url: calendarData.owner_photo_url || '',
                          }}
                          trigger={
                            <span
                              className="font-semibold ml-1 cursor-pointer hover:underline"
                            >
                              {calendarData.owner_name}
                            </span>
                          }
                        />
                      </div>
                    </div>

                    <Link to={`/${lng}/shared-user-calendar/${calendarData.id}`}>
                      <Button variant="outline">
                        {t('open')}
                      </Button>
                    </Link>

                    <ActionSheet
                      actions={toActionSheetItems(
                        buildSharedCalendarActions(
                          { calendarId: calendarData.id, lng: lng!, basePath: 'shared-user-calendar', selectedDate: null },
                          {
                            onDelete: () => handleDeleteSharedCalendarClick(calendarData.id),
                            onExportPdf: () => openPdfDialog(calendarData.id),
                          },
                          ['pillbox', 'day_view'],
                        ),
                        t,
                      )}
                    />
                  </div>
                  {calendarData.ifLowStock && (
                    <Link to={`/${lng}/shared-user-calendar/${calendarData.id}/stock-alerts`}>
                      <StatusBadge variant="warning" icon={AlertTriangle} text={t('stock_alert')} />
                    </Link>
                  )}
                </div>
              )
            )}
          </div>
        ) : (
          <div className="flex items-center w-full px-3 py-2 rounded-md bg-blue-500/15 border border-blue-500/50 text-foreground shadow">
            <Info className="h-5 w-5 mr-2 text-blue-600" />
            <span className="font-semibold">{t('no_shared_calendars')}</span>
          </div>
        )}
      </div>

      {/* Dialog export PDF */}
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('boxes.export_pdf_title')}</DialogTitle>
            <DialogDescription>{t('boxes.export_pdf_description')}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 py-4">
            <Checkbox
              id="includeInactive"
              checked={includeInactive}
              onCheckedChange={(checked: CheckedState) => setIncludeInactive(checked === true)}
            />
            <Label htmlFor="includeInactive" className="cursor-pointer">
              {t('boxes.include_inactive_medicines')}
            </Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleDownloadPdf}>
              <Download className="h-4 w-4 mr-2" />
              {t('boxes.export_pdf')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SelectCalendar;
