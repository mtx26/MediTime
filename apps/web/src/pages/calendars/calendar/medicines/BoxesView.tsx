import { useBoxesView } from '@/hooks/boxes/useBoxesView';
import ActionSheet from '@/components/common/ActionSheet';
import QRCodeScanner from '@/components/scanner/QRCodeScanner';
import AlertBanner from '@/components/common/AlertBanner';
import type { BoxesViewPageProps } from '@meditime/types';

import { Package, PlusCircle, QrCode, AlertTriangle } from 'lucide-react';
import NotFound from '../../../general/NotFound';

import ActionCard from '@/components/medicines/ActionCard';
import MedicineCard from '@/components/medicines/MedicineCard';
import EditBoxDialog from '@/components/medicines/EditBoxDialog';

// ============================================================================
// MAIN COMPONENT: BoxesView
// ============================================================================

function BoxesView(props: BoxesViewPageProps) {
  const {
    t, lng,
    boxes,
    expandedBoxes, setExpandedBoxes,
    notFound,
    calendarId,
    calendarSource,
    basePath,
    getCommonActions,
    editingBoxId, editingBox, setEditingBox, initEditing, cancelEditing,
    addCondition, deleteCondition, updateCondition, handleSubmit, createTemporaryBox,
    conditionFields,
    showQRModal, singleScan, addScannedMedicines, updateScannedMedicine,
    openAddScan, openUpdateScan, closeScanner,
  } = useBoxesView(props);

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