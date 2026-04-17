import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useRealtimeBoxesSwitcher } from '@/hooks/realtime/useRealtimeBoxesSwitcher';
import { useBoxEditing } from '@/hooks/boxes/useBoxEditing';
import { useBoxScanner } from '@/hooks/boxes/useBoxScanner';
import { getConditionFields } from '@/utils/getConditionFields';
import { useAlert } from '@/contexts/AlertContext';
import { useLoading } from '@/components/ui/loading';
import { getCalendarSourceMap, buildPersonalCalendarActions, buildSharedCalendarActions, detectCalendarType } from '@meditime/utils';
import ActionSheet from '@/components/common/ActionSheet';
import { useTranslation } from 'react-i18next';
import { toActionSheetItems } from '@/utils/actionSheetAdapter';
import QRCodeScanner from '@/components/scanner/QRCodeScanner';
import AlertBanner from '@/components/common/AlertBanner';
import type {
  BoxesViewPageProps,
  BoxesViewBoxItem,
} from '@meditime/types';
import type { CalendarSourceGroup } from '@meditime/utils';

import { Package, PlusCircle, QrCode, AlertTriangle } from 'lucide-react';
import NotFound from '../../../general/NotFound';

// Extracted components
import ActionCard from '@/components/medicines/ActionCard';
import MedicineCard from '@/components/medicines/MedicineCard';
import EditBoxDialog from '@/components/medicines/EditBoxDialog';

// ============================================================================
// MAIN COMPONENT: BoxesView
// ============================================================================

function BoxesView({ personalCalendars, sharedUserCalendars, tokenCalendars }: BoxesViewPageProps) {
  const location = useLocation();
  const params = useParams<{ lng?: string; calendarId?: string; sharedToken?: string }>();
  const navigate = useNavigate();
  const lng = params.lng;
  const { t } = useTranslation();

  // =========================================================================
  // STATE
  // =========================================================================
  
  const [boxes, setBoxes] = useState<BoxesViewBoxItem[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState<boolean | undefined>(undefined);
  const { showConfirm } = useAlert();
  const [expandedBoxes, setExpandedBoxes] = useState<Record<string, boolean>>({});
  const [rep, setRep] = useState<Response | null>(null);
  const [notFound, setNotFound] = useState(false);

  // =========================================================================
  // CALENDAR DETECTION
  // =========================================================================
  
  const { calendarType, basePath } = detectCalendarType(location.pathname);
  const calendarId = calendarType === 'token' ? params.sharedToken : params.calendarId;

  const calendarSource = (getCalendarSourceMap(
    personalCalendars, 
    sharedUserCalendars, 
    tokenCalendars
  )[calendarType] || {}) as CalendarSourceGroup;
  
  const isDemo = calendarId === 'demo';

  // =========================================================================
  // HOOKS
  // =========================================================================
  
  useRealtimeBoxesSwitcher(
    isDemo ? '' : calendarType,
    calendarId ?? null,
    setBoxes,
    setLoadingBoxes,
    setRep
  );

  const {
    editingBoxId, editingBox, setEditingBox, initEditing, cancelEditing,
    addCondition, deleteCondition, updateCondition, handleSubmit, createTemporaryBox,
  } = useBoxEditing({ calendarSource, calendarId });

  const {
    showQRModal, singleScan, addScannedMedicines, updateScannedMedicine,
    openAddScan, openUpdateScan, closeScanner,
  } = useBoxScanner({ calendarSource, calendarId, boxes, createTemporaryBox });

  const conditionFields = getConditionFields(t);
  
  useEffect(() => {
    if (rep && rep.status === 404) {
      setNotFound(true);
      setLoadingBoxes(false);
    }
  }, [rep]);

  useEffect(() => {
    if (isDemo) {
      setBoxes([
        {
          id: 'demo-1',
          name: 'Doliprane 1000mg',
          dose: 1000,
          box_capacity: 8,
          stock_quantity: 5,
          stock_alert_threshold: 2,
          conditions: [],
        },
        {
          id: 'demo-2',
          name: 'Amoxicilline',
          dose: 500,
          box_capacity: 12,
          stock_quantity: 1,
          stock_alert_threshold: 3,
          conditions: [],
        },
        {
          id: 'demo-3',
          name: 'Vitamin C',
          dose: 500,
          box_capacity: 30,
          stock_quantity: 25,
          stock_alert_threshold: 5,
          conditions: [],
        },
      ]);
      setLoadingBoxes(true);
    }
  }, [isDemo]);

  // =========================================================================
  // CALENDAR ACTIONS
  // =========================================================================

  // Fonction pour supprimer le calendrier avec confirmation
  const handleDeleteCalendar = () => {
    showConfirm(
      'confirm-danger',
      t('calendar.delete_title'),
      t('calendar.delete_description'),
      async () => {
        const r = await personalCalendars.deleteCalendar(calendarId!);
        if (r.success) {
          navigate(`/${lng}/calendars`);
        }
      }
    );
  };

  // Fonction pour supprimer un calendrier partagé avec confirmation
  const handleDeleteSharedCalendar = () => {
    showConfirm(
      'confirm-danger',
      t('delete_calendar_title'),
      t('delete_calendar_description'),
      async () => {
        const r = await sharedUserCalendars.deleteSharedCalendar(calendarId!);
        if (r.success) {
          navigate(`/${lng}/calendars`);
        }
      }
    );
  };

  const getCommonActions = () => {
    const builder = calendarType === 'personal'
      ? buildPersonalCalendarActions(
          { calendarId: calendarId!, lng: lng!, basePath, selectedDate: null },
          {
            onRename: undefined,
            onDelete: handleDeleteCalendar,
            onExportPdf: () => calendarSource.downloadCalendarPdf!(calendarId!, false),
          },
          ['rename', 'medicines'],
        )
      : buildSharedCalendarActions(
          { calendarId: calendarId!, lng: lng!, basePath, selectedDate: null },
          {
            onDelete: handleDeleteSharedCalendar,
            onExportPdf: () => calendarSource.downloadCalendarPdf!(calendarId!, false),
          },
          ['medicines'],
        );
    return toActionSheetItems(builder, t);
  };

  // =========================================================================
  // LOADING STATES
  // =========================================================================
  
  const { showLoading } = useLoading();

  // Gérer l'affichage du spinner global
  useEffect(() => {
    showLoading(loadingBoxes === undefined, t('boxes.loading_medicine_boxes'));
  }, [loadingBoxes, showLoading, t]);

  // Affichage de la page 404 si le calendrier n'existe pas
  if (notFound) {
    return <NotFound />;
  }

  // =========================================================================
  // RENDER
  // =========================================================================
  
  return (
    <div className="container mx-auto flex flex-col items-center gap-4">
      <div className="w-full max-w-3xl">
        
        {/* Header */}
        <div
          className="flex justify-between items-center mb-4 flex-wrap gap-2"
          data-tour="stock-view-title"
        >
          <h4 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('boxes.title')}
          </h4>
          <ActionSheet actions={getCommonActions()} />
        </div>

        {/* Stock Alert Banner */}
        {boxes.some(box => box.stock_quantity <= box.stock_alert_threshold && box.stock_alert_threshold > 0) && (
          <AlertBanner
            to={`/${lng}/${basePath}/${calendarId}/stock-alerts`}
            icon={AlertTriangle}
            text={t('stock_alert')}
            tooltip={t('stock_alert_tooltip')}
            variant="warning"
          />
        )}

        {/* Boxes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boxes.map((box) => (
            <MedicineCard
              key={box.id}
              box={box}
              expandedBoxes={expandedBoxes}
              setExpandedBoxes={setExpandedBoxes}
              calendarId={calendarId}
              calendarSource={calendarSource}
              onEdit={initEditing}
              onUpdateScan={() => openUpdateScan(box.id)}
              basePath={basePath}
              t={t}
            />
          ))}

          {/* Action Cards */}
          <div className="flex flex-col gap-3 h-full">
            <ActionCard
              variant="success"
              icon={PlusCircle}
              text={t('boxes.add_manual')}
              onClick={() => createTemporaryBox()}
              hasTooltip={false}
              dataTour="add-manual-btn"
            />
            <ActionCard
              variant="primary"
              icon={QrCode}
              text={t('boxes.add_with_qr')}
              onClick={() => openAddScan()}
              hasTooltip={true}
              tooltip={t('boxes.qr_code_help_text')}
              dataTour="add-qr-btn"
            />
          </div>
        </div>
      </div>

      {/* QR Code Scanner Modal */}
      <QRCodeScanner
        modal={true}
        show={showQRModal}
        singleScan={singleScan}
        onAddAll={singleScan ? updateScannedMedicine : addScannedMedicines}
        onClose={closeScanner}
      />

      {/* Edit Box Dialog */}
      <EditBoxDialog
        editingBoxId={editingBoxId}
        editingBox={editingBox}
        conditionFields={conditionFields}
        setEditingBox={setEditingBox}
        onSubmit={handleSubmit}
        onCancel={cancelEditing}
        onAddCondition={addCondition}
        onDeleteCondition={deleteCondition}
        onUpdateCondition={updateCondition}
      />
    </div>
  );
}

export default BoxesView;