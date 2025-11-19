import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import NoteEditor from '../components/NoteEditor';
import NotesGallery from '../components/NotesGallery';
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
function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [viewMode, setViewMode] = useState('gallery'); // gallery | workspace
  const initialWalletState = {
    connected: false,
    connecting: false,
    address: null,
    walletName: null,
    error: null
  };
  const [walletState, setWalletState] = useState(initialWalletState);

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
    try {
      setLoading(true);
      console.log('Creating new note...');
      
      // Create note via backend API
      const backendNote = await noteService.createNote('New Note', '');
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
        await noteService.updateNote(noteId, content);
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
				await noteService.deleteNote(noteId);
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
        await noteService.updateNotePriority(noteId, newIsPinned);
      }

      // Update local state
      const updatedNotes = notes.map(note => {
        if (note.id === noteId) {
          return {
            ...note,
            isPinned: newIsPinned,
            priority: noteService.pinnedToPriority(newIsPinned),
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
            priority: noteService.pinnedToPriority(newIsPinned),
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
        await noteService.updateNotePriority(noteId, newIsPinned);
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

  const detectWalletProvider = () => {
    if (typeof window === 'undefined' || !window.cardano) return null;
    const preferredOrder = ['eternl', 'nami', 'flint', 'lace', 'gerowallet', 'typhoncip30'];
    for (const key of preferredOrder) {
      if (window.cardano[key]) {
        const provider = window.cardano[key];
        return {
          key,
          provider,
          label: provider?.name || key.charAt(0).toUpperCase() + key.slice(1)
        };
      }
    }

    const dynamicKeys = Object.keys(window.cardano).filter(
      (key) => typeof window.cardano[key] === 'object'
    );

    if (dynamicKeys.length > 0) {
      const key = dynamicKeys[0];
      const provider = window.cardano[key];
      return {
        key,
        provider,
        label: provider?.name || key
      };
    }

    return null;
  };

  const handleWalletButtonClick = async () => {
    if (walletState.connected) {
      setWalletState(initialWalletState);
      return;
    }

    if (typeof window === 'undefined') {
      setWalletState((prev) => ({
        ...prev,
        error: 'Wallet connections are only available in the browser.'
      }));
      return;
    }

    const walletHandle = detectWalletProvider();
    if (!walletHandle || !walletHandle.provider?.enable) {
      setWalletState((prev) => ({
        ...prev,
        error: 'No CIP-30 compatible Cardano wallet detected.'
      }));
      return;
    }

    try {
      setWalletState((prev) => ({
        ...prev,
        connecting: true,
        error: null
      }));

      const api = await walletHandle.provider.enable();
      const rewardAddresses = (await api.getRewardAddresses?.()) || [];
      const usedAddresses = rewardAddresses.length
        ? rewardAddresses
        : (await api.getUsedAddresses?.()) || [];
      const changeAddress = await api.getChangeAddress?.();
      const resolvedAddress = rewardAddresses[0] || usedAddresses[0] || changeAddress || '';

      setWalletState({
        connected: true,
        connecting: false,
        address: resolvedAddress,
        walletName: walletHandle.label,
        error: null
      });
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setWalletState({
        connected: false,
        connecting: false,
        address: null,
        walletName: null,
        error: error?.message || 'Wallet connection failed. Please try again.'
      });
    }
  };

  const handleCreateNoteClick = () => {
    setViewMode('workspace');
    return createNewNote();
  };

  const handleOpenExistingNote = (noteId) => {
    setViewMode('workspace');
    selectNote(noteId);
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

  const selectedNote = notes.find(note => note.id === selectedNoteId);

  if (viewMode === 'gallery') {
    return (
      <NotesGallery
        notes={notes}
        loading={loading}
        onSelectNote={handleOpenExistingNote}
        onCreateNote={handleCreateNoteClick}
        walletState={walletState}
        onWalletButtonClick={handleWalletButtonClick}
      />
    );
  }

  return (
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
  );
}

export default NotesPage;