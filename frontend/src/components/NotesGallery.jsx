import { useMemo, useState } from 'react';
import NotesLogo from '../assets/Notes.png';
import '../styles/NotesGallery.css';

function NotesGallery({
  notes = [],
  loading,
  onSelectNote,
  onCreateNote,
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
      if (sortKey === 'created') {
        return (b.timestamp || 0) - (a.timestamp || 0);
      }
      if (sortKey === 'priority') {
        const priorityRank = { High: 2, Medium: 1, Low: 0 };
        return (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
      }
      return (b.lastModified || 0) - (a.lastModified || 0);
    });

    return sortedNotes;
  }, [notes, searchTerm, showPinnedOnly, sortKey]);

  const formatWalletLabel = () => {
    if (walletState?.connecting) return 'Connecting...';
    if (walletState?.connected) {
      const walletName = walletState.walletName || 'Wallet';
      const addr = walletState.address || '';
      const shortAddress =
        addr.length > 10 ? `${addr.slice(0, 8)}...${addr.slice(-4)}` : addr;
      return `${walletName} · ${shortAddress}`;
    }
    return 'Connect Wallet';
  };

  const handleNoteClick = (noteId) => {
    if (typeof onSelectNote === 'function') {
      onSelectNote(noteId);
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
            className={`ghost-btn wallet-btn ${walletState?.connected ? 'connected' : ''}`}
            type="button"
            onClick={onWalletButtonClick}
            disabled={walletState?.connecting}
            title={
              walletState?.connected
                ? walletState.address
                : walletState?.error || 'Connect your Cardano wallet'
            }
          >
            {formatWalletLabel()}
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
                {note.isPinned && <span className="note-pill">📌 Pinned</span>}
              </div>
              <p className="note-card-preview">
                {note.preview || 'No additional content yet.'}
              </p>
              <div className="note-card-footer">
                <span>{note.priority || 'Medium'} priority</span>
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

