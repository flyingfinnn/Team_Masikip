import { useState, useEffect } from 'react';
import '../styles/NoteModal.css';

function NoteModal({ isOpen, onClose, note, onSave, onDelete, onSetPriority }) {
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('Medium');

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
    if (onSave) {
      await onSave(note ? note.id : undefined, content);
      onClose();
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
    if (note && onSetPriority) {
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
            <button className="modal-btn save-btn" onClick={handleSave}>
              💾 Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteModal;
