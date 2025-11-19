import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import NoteEditor from '../components/NoteEditor';
import NotesGallery from '../components/NotesGallery';
import NoteModal from '../components/NoteModal';
import noteService from '../services/noteService';
import '../styles/NotesPage.css';

/**
 * BLOCKCHAIN INTEGRATION ROADMAP
 * ==============================
 * 
 * This component implements the frontend for a blockchain-based notes application.
 * Each note operation will be recorded as a transaction block in the chain.
 * 
 * TRANSACTION TYPES:
 * 
 * 1. CREATE_NOTE - Creates new note transaction block
 *    - noteId: Unique identifier
 *    - title: First line of content
 *    - content: Full note content
 *    - tags: Array of optional tags
 *    - timestamp: Unix timestamp
 *    - metadata: { isPinned, createdAt, lastModified }
 * 
 * 2. UPDATE_NOTE - Updates existing note (creates new block, links to previous)
 *    - noteId: Reference to original note
 *    - title, content: Updated values
 *    - lastModified: Timestamp of edit
 *    - previousHash: Hash of previous version for chain integrity
 * 
 * 3. SET_PRIORITY - Changes note priority/pinning status
 *    - noteId: Note identifier
 *    - isPinned: Boolean priority status
 *    - priorityLevel: 'HIGH' | 'NORMAL'
 * 
 * 4. STYLE_NOTE - Future: Text formatting/styling changes
 * 5. DELETE_NOTE - Future: Note deletion (tombstone transaction)
 * 6. AUTO_SAVE - Future: Automatic save transactions
 * 
 * BACKEND API ENDPOINTS (To be implemented):
 * - POST /api/notes/create - Create note transaction
 * - PUT /api/notes/{id}/update - Update note transaction  
 * - PATCH /api/notes/{id}/priority - Priority change transaction
 * - GET /api/notes - Fetch all notes from blockchain
 * - GET /api/notes/{id}/history - Get note version history
 * 
 * BLOCKCHAIN STRUCTURE:
 * Each transaction will contain:
 * - blockHash: SHA-256 hash of block content
 * - previousHash: Hash of previous block (for chain integrity)
 * - timestamp: Block creation time
 * - transactionData: Note operation data
 * - signature: Digital signature for authenticity
 */
const fallbackWalletState = {
  connected: false,
  connecting: false,
  address: null,
  walletName: null,
  error: null,
};

function NotesPage({ walletState = fallbackWalletState, onWalletButtonClick = () => {} }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [viewMode, setViewMode] = useState('gallery'); // gallery | workspace
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalNote, setModalNote] = useState(null);

  // Load notes from backend on component mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      console.log('Attempting to load notes from backend...');
      const backendNotes = await noteService.getAllNotes();
      console.log('Backend notes loaded:', backendNotes);

      if (Array.isArray(backendNotes)) {
        const transformedNotes = backendNotes.map(note => noteService.transformNote(note));
        console.log('Transformed notes:', transformedNotes);
        setNotes(transformedNotes);
      } else {
        console.warn('Backend did not return an array of notes:', backendNotes);
        setNotes([]);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
      // Fallback to empty array if backend is unavailable
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const createNewNote = async () => {
<<<<<<< HEAD
    try {
      setLoading(true);
      console.log('Creating new note...');

      // Create note via backend API
      const backendNote = await noteService.createNote('New Note', '', walletState.address);
      console.log('Backend note created:', backendNote);
      const newNote = noteService.transformNote(backendNote);
      console.log('Transformed note:', newNote);

      // Update local state
      const updatedNotes = notes.map(note => ({ ...note, isSelected: false }));
      updatedNotes.unshift({ ...newNote, isSelected: true });
      setNotes(updatedNotes);
      setSelectedNoteId(newNote.id);

    } catch (error) {
      console.error('Failed to create note:', error);

      // Fallback to local-only note creation if backend is unavailable
      const fallbackNote = {
        id: `local-${Date.now()}`,
        title: 'New Note',
        preview: '',
        content: '',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        isSelected: true,
        isPinned: false,
        priority: 'Medium',
        isDeleted: false,
        tags: []
      };

      const updatedNotes = notes.map(note => ({ ...note, isSelected: false }));
      updatedNotes.unshift(fallbackNote);
      setNotes(updatedNotes);
      setSelectedNoteId(fallbackNote.id);
    } finally {
      setLoading(false);
    }
=======
    // Open modal for new note creation
    setModalNote(null);
    setIsModalOpen(true);
>>>>>>> 8425a9656d6cc3624477cf85fb3a4c9cbadd3ff9
  };

  const selectNote = (noteId) => {
    const updatedNotes = notes.map(note => ({
      ...note,
      isSelected: note.id === noteId
    }));
    setNotes(updatedNotes);
    setSelectedNoteId(noteId);
  };

  const updateNote = async (noteId, content) => {
    try {
      console.log('Updating note:', { noteId, contentLength: content.length });

      // Don't update deleted notes
      const currentNote = notes.find(note => note.id === noteId);
      if (!currentNote || currentNote.isDeleted) {
        console.log('Note not found or deleted, skipping update');
        return;
      }

      console.log('Current note:', currentNote);

      // Update via backend API if not a local note
      if (!String(noteId).startsWith('local-')) {
        console.log('Updating note in backend...');
        await noteService.updateNote(noteId, content, walletState.address);
        console.log('Backend update successful');
      } else {
        console.log('Skipping backend update for local note');
      }

      // Update local state immediately for better UX
      const updatedNotes = notes.map(note => {
        if (note.id === noteId) {
          const lines = content.split('\n');
          const title = lines[0] || 'New Note';
          const preview = noteService.generatePreview(content);

          return {
            ...note,
            title: title.toUpperCase(),
            preview,
            content,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            lastModified: Date.now()
          };
        }
        return note;
      });
      setNotes(updatedNotes);

    } catch (error) {
      console.error('Failed to update note:', error);
      // Still update local state even if backend fails
      const updatedNotes = notes.map(note => {
        if (note.id === noteId) {
          const lines = content.split('\n');
          const title = lines[0] || 'New Note';
          const preview = noteService.generatePreview(content);

          return {
            ...note,
            title: title.toUpperCase(),
            preview,
            content,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            lastModified: Date.now()
          };
        }
        return note;
      });
      setNotes(updatedNotes);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      // Call backend for non-local notes
      if (!String(noteId).startsWith('local-')) {
        await noteService.deleteNote(noteId, walletState.address);
      }

      // Optimistically update local state (soft delete)
      const updatedNotes = notes.map(note => {
        if (note.id === noteId) {
          return {
            ...note,
            isDeleted: true,
            lastModified: Date.now(),
            deletedAt: Date.now()
          };
        }
        return note;
      });
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Failed to delete note:', error);
      // Still update local state even if backend fails
      const updatedNotes = notes.map(note => {
        if (note.id === noteId) {
          return {
            ...note,
            isDeleted: true,
            lastModified: Date.now(),
            deletedAt: Date.now()
          };
        }
        return note;
      });
      setNotes(updatedNotes);
    }
  };

  const restoreNote = (noteId) => {
    const updatedNotes = notes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          isDeleted: false,
          lastModified: Date.now(),
          deletedAt: undefined
        };
      }
      return note;
    });
    setNotes(updatedNotes);
  };

  const togglePin = async (noteId) => {
    try {
      const currentNote = notes.find(note => note.id === noteId);
      if (!currentNote || currentNote.isDeleted) return;

      const newIsPinned = !currentNote.isPinned;

      // Update via backend API if not a local note
      if (!String(noteId).startsWith('local-')) {
        await noteService.updateNotePriority(noteId, newIsPinned, walletState.address);
      }

      // Update local state - only toggle isPinned, keep priority unchanged
      const updatedNotes = notes.map(note => {
        if (note.id === noteId) {
          return {
            ...note,
            isPinned: newIsPinned,
            lastModified: Date.now()
          };
        }
        return note;
      });
      setNotes(updatedNotes);

    } catch (error) {
      console.error('Failed to update pin status:', error);
      // Still update local state even if backend fails
      const updatedNotes = notes.map(note => {
        if (note.id === noteId) {
          const newIsPinned = !note.isPinned;
          return {
            ...note,
            isPinned: newIsPinned,
            lastModified: Date.now()
          };
        }
        return note;
      });
      setNotes(updatedNotes);
    }
  };

  const setPriority = async (noteId, newPriority) => {
    try {
      const currentNote = notes.find(note => note.id === noteId);
      if (!currentNote || currentNote.isDeleted) return;

      const newIsPinned = noteService.priorityToPinned(newPriority);

      // Update via backend API if not a local note
      if (!String(noteId).startsWith('local-')) {
        await noteService.updateNotePriority(noteId, newIsPinned, walletState.address);
      }

      // Update local state
      const updatedNotes = notes.map(note => {
        if (note.id === noteId) {
          return {
            ...note,
            priority: newPriority,
            isPinned: newIsPinned,
            lastModified: Date.now()
          };
        }
        return note;
      });
      setNotes(updatedNotes);

    } catch (error) {
      console.error('Failed to update priority:', error);
      // Still update local state even if backend fails
      const updatedNotes = notes.map(note => {
        if (note.id === noteId) {
          return {
            ...note,
            priority: newPriority,
            isPinned: noteService.priorityToPinned(newPriority),
            lastModified: Date.now()
          };
        }
        return note;
      });
      setNotes(updatedNotes);
    }
  };

  const handleCreateNoteClick = () => {
    createNewNote();
  };

  const handleOpenExistingNote = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setModalNote(note);
      setIsModalOpen(true);
    }
  };

  const handleBackToGallery = () => {
    setViewMode('gallery');
    setSelectedNoteId(null);
    setNotes((prevNotes) =>
      prevNotes.map((note) => ({
        ...note,
        isSelected: false
      }))
    );
  };

  const handleModalSave = async (noteId, content) => {
    try {
      setLoading(true);
      const title = (content.split('\n')[0] || 'New Note').toString();
      
      if (!noteId || String(noteId).startsWith('local-')) {
        // Creating new note
        const created = await noteService.createNote(title, content);
        await loadNotes();
        if (created && created.id) {
          setSelectedNoteId(created.id);
        }
      } else {
        // Updating existing note
        await noteService.updateNote(noteId, content);
        await loadNotes();
        setSelectedNoteId(noteId);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalNote(null);
  };

  const selectedNote = notes.find(note => note.id === selectedNoteId);

  return (
<<<<<<< HEAD
    <div className="notes-app">
      <Sidebar
        notes={notes}
        loading={loading}
        onCreateNote={handleCreateNoteClick}
        onSelectNote={selectNote}
        onBackToGallery={handleBackToGallery}
        walletState={walletState}
        onWalletButtonClick={handleWalletButtonClick}
      />
      <NoteEditor
        note={selectedNote}
        onUpdateNote={updateNote}
        onTogglePin={togglePin}
        onSetPriority={setPriority}
        onDeleteNote={deleteNote}
        onRestoreNote={restoreNote}
        onSave={async (noteId, content) => {
          try {
            setLoading(true);
            const title = (content.split('\n')[0] || 'New Note').toString();
            if (!noteId || String(noteId).startsWith('local-')) {
              const created = await noteService.createNote(title, content, walletState.address);
              await loadNotes();
              if (created && created.id) {
                setSelectedNoteId(created.id);
              }
            } else {
              await noteService.updateNote(noteId, content, walletState.address);
              await loadNotes();
              setSelectedNoteId(noteId);
            }
          } catch (err) {
            console.error('Save failed:', err);
          } finally {
            setLoading(false);
          }
        }}
=======
    <>
      {viewMode === 'gallery' ? (
        <NotesGallery
          notes={notes}
          loading={loading}
          onSelectNote={handleOpenExistingNote}
          onCreateNote={handleCreateNoteClick}
          onDeleteNote={deleteNote}
          onTogglePin={togglePin}
          walletState={walletState}
          />
      ) : (
        <div className="notes-app">
          <Sidebar 
            notes={notes}
            loading={loading}
            onCreateNote={handleCreateNoteClick}
            onSelectNote={selectNote}
            onBackToGallery={handleBackToGallery}
            walletState={walletState}
            onWalletButtonClick={onWalletButtonClick}
          />
          <NoteEditor 
            note={selectedNote}
            onUpdateNote={updateNote}
            onTogglePin={togglePin}
            onSetPriority={setPriority}
            onDeleteNote={deleteNote}
            onRestoreNote={restoreNote}
            onSave={async (noteId, content) => {
              try {
                setLoading(true);
                const title = (content.split('\n')[0] || 'New Note').toString();
                if (!noteId || String(noteId).startsWith('local-')) {
                  const created = await noteService.createNote(title, content);
                  await loadNotes();
                  if (created && created.id) {
                    setSelectedNoteId(created.id);
                  }
                } else {
                  await noteService.updateNote(noteId, content);
                  await loadNotes();
                  setSelectedNoteId(noteId);
                }
              } catch (err) {
                console.error('Save failed:', err);
              } finally {
                setLoading(false);
              }
            }}
          />
        </div>
      )}
      
      <NoteModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        note={modalNote}
        onSave={handleModalSave}
        onDelete={deleteNote}
        onSetPriority={setPriority}
>>>>>>> 8425a9656d6cc3624477cf85fb3a4c9cbadd3ff9
      />
    </>
  );
}

export default NotesPage;