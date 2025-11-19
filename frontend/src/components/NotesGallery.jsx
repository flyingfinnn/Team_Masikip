import { useMemo, useState } from 'react';
import NotesLogo from '../assets/Notes.png';
import '../styles/NotesGallery.css';

function NotesGallery({
  notes = [],
  loading,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onTogglePin,
  walletState,
  onWalletButtonClick
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('updated');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  const filteredNotes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const activeNotes = notes.filter(note => !note.isDeleted);
    const searchedNotes = term
      ? activeNotes.filter(note => {
          const title = (note.title || '').toLowerCase();
          const content = (note.content || '').toLowerCase();
          return title.includes(term) || content.includes(term);
        })
      : activeNotes;

    const pinnedFiltered = showPinnedOnly
      ? searchedNotes.filter(note => note.isPinned)
      : searchedNotes;

    const sortedNotes = [...pinnedFiltered].sort((a, b) => {
      // First priority: Pinned notes always at the top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Second priority: Sort by priority level (High > Medium > Low)
      const priorityRank = { High: 3, Medium: 2, Low: 1 };
      const priorityDiff = (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      // Third priority: Sort by the selected sort key
      if (sortKey === 'created') {
        return (b.timestamp || 0) - (a.timestamp || 0);
      }
      if (sortKey === 'priority') {
        return 0; // Already sorted by priority above
      }
      return (b.lastModified || 0) - (a.lastModified || 0);
    });

    return sortedNotes;
  }, [notes, searchTerm, showPinnedOnly, sortKey]);

  const handleNoteClick = (noteId) => {
    if (typeof onSelectNote === 'function') {
      onSelectNote(noteId);
    }
  };

  const handleEditClick = (e, noteId) => {
    e.stopPropagation();
    if (typeof onSelectNote === 'function') {
      onSelectNote(noteId);
    }
  };

  const handleDeleteClick = async (e, noteId) => {
    e.stopPropagation();
    if (typeof onDeleteNote === 'function') {
      const confirmed = window.confirm('Are you sure you want to delete this note?');
      if (confirmed) {
        await onDeleteNote(noteId);
      }
    }
  };

  const handlePinClick = async (e, noteId) => {
    e.stopPropagation();
    if (typeof onTogglePin === 'function') {
      await onTogglePin(noteId);
    }
  };

  return (
    <div className="notes-gallery">
      <header className="gallery-header">
        <div className="branding">
          <img src={NotesLogo} alt="Masikip Notes" className="gallery-logo" />
          <div>
            <h1>Masikip Notes</h1>
            <p>All blockchain-backed notes at a glance.</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="ghost-btn"
            type="button"
            onClick={() =>
              setSortKey((prev) =>
                prev === 'updated' ? 'created' : prev === 'created' ? 'priority' : 'updated'
              )
            }
          >
            ⇅ Sort: {sortKey === 'updated' ? 'Last Edited' : sortKey === 'created' ? 'Creation' : 'Priority'}
          </button>
          <button
            className="ghost-btn"
            type="button"
            onClick={() => setShowPinnedOnly((prev) => !prev)}
          >
            {showPinnedOnly ? 'Show All' : 'Pinned Only'}
          </button>
          <button 
            className={`primary-btn ${!walletState?.connected ? 'disabled' : ''}`} 
            type="button" 
            onClick={onCreateNote}
            disabled={!walletState?.connected}
            title={!walletState?.connected ? 'Connect wallet to create a note' : 'Create new note'}
          >
            + New Note
          </button>
        </div>
      </header>

      <div className="toolbar">
        <div className="search-field">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by title or content"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="status-pill">
          {loading ? 'Loading notes...' : `${filteredNotes.length} notes`}
        </div>
      </div>

      <section className="notes-grid">
        {loading ? (
          <div className="gallery-state">Retrieving on-chain history...</div>
        ) : filteredNotes.length === 0 ? (
          <div className="gallery-state">
            <p>No notes to show yet.</p>
            <button className="primary-btn ghost" onClick={onCreateNote}>
              Create the first note
            </button>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <article
              key={note.id}
              className={`note-card ${note.isPinned ? 'pinned' : ''}`}
              onClick={() => handleNoteClick(note.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleNoteClick(note.id);
                }
              }}
            >
              <div className="note-card-header">
                <span className="note-card-title">{note.title || 'Untitled'}</span>
                <div className="note-card-actions">
                  {note.isPinned && <span className="note-pill">📌 Pinned</span>}
                  <button
                    className={`note-action-btn pin-btn ${note.isPinned ? 'pinned' : ''}`}
                    onClick={(e) => handlePinClick(e, note.id)}
                    title={note.isPinned ? 'Unpin note' : 'Pin note'}
                  >
                    📌
                  </button>
                  <button
                    className="note-action-btn edit-btn"
                    onClick={(e) => handleEditClick(e, note.id)}
                    title="Edit note"
                  >
                    ✏️
                  </button>
                  <button
                    className="note-action-btn delete-btn"
                    onClick={(e) => handleDeleteClick(e, note.id)}
                    title="Delete note"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p className="note-card-preview">
                {note.preview || 'No additional content yet.'}
              </p>
              <div className="note-card-footer">
                <span className={`priority-${(note.priority || 'Medium').toLowerCase()}`}>
                  {note.priority || 'Medium'} priority
                </span>
                <span>{note.time || ''}</span>
              </div>
            </article>
          ))
        )}
      </section>

      {walletState?.error && (
        <div className="wallet-error" role="status">
          {walletState.error}
        </div>
      )}
    </div>
  );
}

export default NotesGallery;

