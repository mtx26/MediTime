import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import HoveredUserProfile from '../../components/common/HoveredUserProfile';
import ActionSheet from '../../components/common/ActionSheet';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../../contexts/AlertContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Users, Pencil, Share, Pill, Download, AlertTriangle, Settings, Trash2, Plus, X, AlertCircle } from 'lucide-react';


function SelectCalendar({
  personalCalendars,
  sharedUserCalendars
}) {
  const { lng } = useParams();
  const { t } = useTranslation();
  const { showConfirm } = useAlert();

  // 📅 Gestion des calendriers
  const [renameValues, setRenameValues] = useState({}); // État pour les valeurs de renommage de calendrier
  const [renameMode, setRenameMode] = useState(null); // État pour le mode de renommage

  const renameConfirmAction = async (calendarId) => {
    const rep = await personalCalendars.renameCalendar(
      calendarId,
      renameValues[calendarId]
    );
    if (rep.success) {
      setRenameValues((prev) => ({ ...prev, [calendarId]: '' }));
    }
  };

  // 🔄 Renommage d'un calendrier
  const handleRenameClick = (calendarId) => {
    showConfirm(
      'confirm-safe',
      t('calendar.rename_title'),
      t('calendar.rename_description'),
      () => renameConfirmAction(calendarId)
    );
  };

  const deleteConfirmAction = async (calendarId) => {
    await personalCalendars.deleteCalendar(calendarId);
  };

  const handleDeleteCalendarClick = (calendarId) => {
    showConfirm(
      'confirm-danger',
      t('calendar.delete_title'),
      t('calendar.delete_description'),
      () => deleteConfirmAction(calendarId)
    );
  };

  const deleteSharedCalendarConfirmAction = async (calendarId) => {
    await sharedUserCalendars.deleteSharedCalendar(calendarId);
  };

  const handleDeleteSharedCalendarClick = (calendarId) => {
    showConfirm(
      'confirm-danger',
      t('calendar.delete_shared_title'),
      t('calendar.delete_shared_description'),
      () => deleteSharedCalendarConfirmAction(calendarId)
    );
  };

  if (personalCalendars.calendarsData === null) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="sr-only">{t('loading_calendars')}</span>
      </div>
    );
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
            personalCalendars.calendarsData.map((calendarData, index) => (
              <div key={index} className="border-b last:border-b-0 p-3 hover:bg-accent/50 transition">
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
                    actions={[
                      {
                        label: (
                          <div className="flex items-center gap-2">
                            <Pencil className="h-4 w-4" />
                            {t('rename')}
                          </div>
                        ),
                        onClick: () => setRenameMode(calendarData.id),
                        title: t('rename')
                      },
                      { separator: true },
                      {
                        label: (
                          <div className="flex items-center gap-2">
                            <Share className="h-4 w-4" />
                            {t('share')}
                          </div>
                        ),
                        linkTo: `/${lng}/shared-calendars?calendar=${calendarData.id}`,
                        title: t('share'),
                      },
                      { separator: true },
                      {
                        label: (
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4" />
                            {t('medicines.label')}
                          </div>
                        ),
                        linkTo: `/${lng}/calendar/${calendarData.id}/boxes`,
                        title: t('medicines.label'),
                      },
                      {
                        label: (
                          <div className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            {t('boxes.export_pdf')}
                          </div>
                        ),
                        onClick: () => personalCalendars.downloadPersonalCalendarPdf(calendarData.id),
                        title: t('boxes.export_pdf'),
                      },
                      {
                        label: (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            {t('stock')}
                          </div>
                        ),
                        linkTo: `/${lng}/calendar/${calendarData.id}/stock-alerts`,
                        title: t('stock'),
                      },
                      { separator: true },
                      {
                        label: (
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            {t('settings.label')}
                          </div>
                        ),
                        linkTo: `/${lng}/calendar/${calendarData.id}/settings`,
                        title: t('settings.label'),
                      },
                      { separator: true },
                      {
                        label: (
                          <div className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            {t('delete')}
                          </div>
                        ),
                        onClick: () => handleDeleteCalendarClick(calendarData.id),
                        title: t('delete'),
                        danger: true,
                      },
                    ]}
                  />
                </div>
                {calendarData.ifLowStock && (
                  <Link to={`/${lng}/calendar/${calendarData.id}/stock-alerts`}>
                    <Badge variant="outline" className="mt-2 gap-1 bg-yellow-50 text-yellow-800 border-yellow-200">
                      <AlertTriangle className="h-3 w-3" />
                      {t('stock_alert')}
                    </Badge>
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
                        value={renameValues[calendarData.id] || ''} // Valeur du champ de renommage
                        onChange={(e) =>
                          setRenameValues({
                            ...renameValues,
                            [calendarData.id]: e.target.value,
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
              (calendarData, index) => (
                <div key={index} className="border-b last:border-b-0 p-3 hover:bg-accent/50 transition">

                  <div className="flex justify-between items-center gap-3">
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
                            display_name: calendarData.owner_name,
                            photo_url: calendarData.owner_photo_url,
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
                      actions={[
                        {
                          label: (
                            <div className="flex items-center gap-2">
                              <Pill className="h-4 w-4" />
                              {t('medicines.label')}
                            </div>
                          ),
                          linkTo: `/${lng}/shared-user-calendar/${calendarData.id}/boxes`,
                          title: t('medicines.label'),
                        },
                        {
                          label: (
                            <div className="flex items-center gap-2">
                              <Download className="h-4 w-4" />
                              {t('boxes.export_pdf')}
                            </div>
                          ),
                          onClick: () => personalCalendars.downloadPersonalCalendarPdf(calendarData.id),
                          title: t('boxes.export_pdf'),
                        },
                        {
                          label: (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              {t('stock')}
                            </div>
                          ),
                          linkTo: `/${lng}/shared-user-calendar/${calendarData.id}/stock-alerts`,
                          title: t('stock'),
                        },
                        { separator: true },
                        {
                          label: (
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              {t('settings.label')}
                            </div>
                          ),
                          linkTo: `/${lng}/shared-user-calendar/${calendarData.id}/settings`,
                          title: t('settings.label'),
                        },
                        { separator: true },
                        {
                          label: (
                            <div className="flex items-center gap-2">
                              <Trash2 className="h-4 w-4" />
                              {t('delete')}
                            </div>
                          ),
                          onClick: () => handleDeleteSharedCalendarClick(calendarData.id),
                          title: t('delete'),
                          danger: true,
                        },
                      ]}
                    />
                  </div>
                  {calendarData.ifLowStock && (
                    <Link to={`/${lng}/shared-user-calendar/${calendarData.id}/stock-alerts`}>
                      <Badge variant="outline" className="mt-2 gap-1 bg-yellow-50 text-yellow-800 border-yellow-200">
                        <AlertTriangle className="h-3 w-3" />
                        {t('stock_alert')}
                      </Badge>
                    </Link>
                  )}
                </div>
              )
            )}
          </div>
        ) : (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 ml-2">
              {t('no_shared_calendars')}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

export default SelectCalendar;
