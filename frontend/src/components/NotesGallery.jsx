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
  const [isPinnedSectionOpen, setIsPinnedSectionOpen] = useState(true);
  const [isAllNotesSectionOpen, setIsAllNotesSectionOpen] = useState(true);

  const { pinnedNotes, unpinnedNotes } = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const activeNotes = notes.filter(note => !note.isDeleted);
    const searchedNotes = term
      ? activeNotes.filter(note => {
          const title = (note.title || '').toLowerCase();
          const content = (note.content || '').toLowerCase();
          return title.includes(term) || content.includes(term);
        })
      : activeNotes;

    const sortNotes = (notesToSort) => {
      return [...notesToSort].sort((a, b) => {
        // Sort by priority level (High > Medium > Low)
        const priorityRank = { High: 3, Medium: 2, Low: 1 };
        const priorityDiff = (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        
        // Then sort by the selected sort key
        if (sortKey === 'created') {
          return (b.timestamp || 0) - (a.timestamp || 0);
        }
        if (sortKey === 'priority') {
          return 0; // Already sorted by priority above
        }
        return (b.lastModified || 0) - (a.lastModified || 0);
      });
    };

    const pinned = sortNotes(notes.filter(note => note.isPinned));
    const unpinned = sortNotes(notes.filter(note => !note.isPinned));

    return { pinnedNotes: pinned, unpinnedNotes: unpinned };
  }, [notes, sortKey]);

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
      <div className="gallery-actions">
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
        <button className="primary-btn" type="button" onClick={onCreateNote}>
          + New Note
        </button>
      </div>

      {loading ? (
        <div className="gallery-state">Retrieving on-chain history...</div>
      ) : pinnedNotes.length === 0 && unpinnedNotes.length === 0 ? (
        <div className="gallery-state">
          <p>No notes to show yet.</p>
          <button className="primary-btn ghost" onClick={onCreateNote}>
            Create the first note
          </button>
        </div>
      ) : (
        <>
          {!showPinnedOnly && pinnedNotes.length > 0 && (
            <section className="notes-section">
              <h2 
                className="section-title collapsible" 
                onClick={() => setIsPinnedSectionOpen(!isPinnedSectionOpen)}
              >
                <span className={`section-arrow ${isPinnedSectionOpen ? 'open' : ''}`}>▼</span>
                <span>📌 Pinned Notes ({pinnedNotes.length})</span>
              </h2>
              {isPinnedSectionOpen && (
                <div className="notes-grid">
                  {pinnedNotes.map((note) => (
                    <article
                      key={note.id}
                      className="note-card"
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
                          <button
                            className="note-action-btn pin-btn pinned"
                            onClick={(e) => handlePinClick(e, note.id)}
                            title="Unpin note"
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
                  ))}
                </div>
              )}
            </section>
          )}

          {(showPinnedOnly ? pinnedNotes.length > 0 : unpinnedNotes.length > 0) && (
            <section className="notes-section">
              <h2 
                className="section-title collapsible"
                onClick={() => showPinnedOnly ? setIsPinnedSectionOpen(!isPinnedSectionOpen) : setIsAllNotesSectionOpen(!isAllNotesSectionOpen)}
              >
                <span className={`section-arrow ${showPinnedOnly ? (isPinnedSectionOpen ? 'open' : '') : (isAllNotesSectionOpen ? 'open' : '')}`}>▼</span>
                <span>{showPinnedOnly ? `📌 Pinned Notes (${pinnedNotes.length})` : `📝 All Notes (${unpinnedNotes.length})`}</span>
              </h2>
              {(showPinnedOnly ? isPinnedSectionOpen : isAllNotesSectionOpen) && (
                <div className="notes-grid">
                  {(showPinnedOnly ? pinnedNotes : unpinnedNotes).map((note) => (
                    <article
                      key={note.id}
                      className="note-card"
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
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {walletState?.error && (
        <div className="wallet-error" role="status">
          {walletState.error}
        </div>
      )}
    </div>
  );
}

export default NotesGallery;

