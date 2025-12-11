import { useState, useEffect } from 'react';
import '../styles/NoteModal.css';

function NoteModal({ isOpen, onClose, note, onSave, onDelete, onSetPriority }) {
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setContent(note.content || '');
      setPriority(note.priority || 'Medium');
    } else {
      setContent('');
      setPriority('Medium');
    }
  }, [note]);

  const handleSave = async () => {
    if (!content.trim()) {
      alert('Note content cannot be empty');
      return;
    }
    
    if (onSave && !saving) {
      try {
        setSaving(true);
        await onSave(note ? note.id : undefined, content, priority);
        onClose();
      } catch (error) {
        // Keep modal open on error so user can retry
        console.error('Save failed, keeping modal open:', error);
        alert(`Failed to save note: ${error.message || 'Unknown error'}`);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDelete = async () => {
    if (note && onDelete) {
      await onDelete(note.id);
      onClose();
    }
  };

  const handlePriorityChange = (e) => {
    const newPriority = e.target.value;
    setPriority(newPriority);
    // Only update priority for existing notes, for new notes it will be set on save
    if (note?.id && onSetPriority) {
      onSetPriority(note.id, newPriority);
    }
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-info">
            <span className="modal-date">{new Date().toLocaleDateString()}</span>
            <span className="modal-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="priority-selector">
            <label htmlFor="priority-select-modal" className="priority-label">Priority:</label>
            <select 
              id="priority-select-modal"
              value={priority} 
              onChange={handlePriorityChange}
              className={`priority-dropdown priority-${priority.toLowerCase()}`}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <button className="modal-close" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start typing your note..."
            className="modal-textarea"
            autoFocus
          />
        </div>

        <div className="modal-footer">
          {note && (
            <button className="modal-btn delete-btn" onClick={handleDelete} title="Delete note">
              🗑️ Delete
            </button>
          )}
          <div className="modal-actions-right">
            <button className="modal-btn cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="modal-btn save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '⏳ Saving...' : '💾 Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteModal;
