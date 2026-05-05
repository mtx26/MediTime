import type { EditingBoxState } from '@meditime/types';

/**
 * Module-level store for the box editor.
 * Avoids serializing the full form state into the URL.
 * Cleared after save or cancel.
 */
type EditBoxStoreState = {
  boxId: string | null;
  editingBox: EditingBoxState | null;
  onSave: (() => Promise<void>) | null;
  onCancel: (() => void) | null;
  onChange: ((editingBox: EditingBoxState) => void) | null;
};

const _state: EditBoxStoreState = {
  boxId: null,
  editingBox: null,
  onSave: null,
  onCancel: null,
  onChange: null,
};

export const editBoxStore = {
  open(
    boxId: string,
    editingBox: EditingBoxState,
    callbacks: {
      onSave: () => Promise<void>;
      onCancel: () => void;
      onChange?: (editingBox: EditingBoxState) => void;
    },
  ) {
    _state.boxId = boxId;
    _state.editingBox = editingBox;
    _state.onSave = callbacks.onSave;
    _state.onCancel = callbacks.onCancel;
    _state.onChange = callbacks.onChange ?? null;
  },

  get boxId() { return _state.boxId; },
  get editingBox() { return _state.editingBox; },
  get onSave() { return _state.onSave; },
  get onCancel() { return _state.onCancel; },
  get onChange() { return _state.onChange; },

  update(editingBox: EditingBoxState) {
    _state.editingBox = editingBox;
    _state.onChange?.(editingBox);
  },

  clear() {
    _state.boxId = null;
    _state.editingBox = null;
    _state.onSave = null;
    _state.onCancel = null;
    _state.onChange = null;
  },
};
