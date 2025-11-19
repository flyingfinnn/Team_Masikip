import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import NoteEditor from '../components/NoteEditor';
import NotesGallery from '../components/NotesGallery';
import NoteModal from '../components/NoteModal';
import ToastContainer from '../components/ToastContainer';
import noteService from '../services/noteService';
import paymentService from '../services/paymentService';
import '../styles/NotesPage.css';

// Service address to receive payments
// Set via environment variable: VITE_SERVICE_ADDRESS
// If not set, will use wallet's own address as fallback (for testing only)
const getServiceAddress = (walletAddress) => {
  const envAddress = import.meta.env.VITE_SERVICE_ADDRESS;
  if (envAddress && !envAddress.includes('...')) {
    return envAddress;
  }
  // Fallback to wallet's own address for testing (payments go back to user)
  return walletAddress;
};

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

function NotesPage({ walletState = fallbackWalletState, onWalletButtonClick = () => {}, walletInstance = null, searchTerm = '' }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [viewMode, setViewMode] = useState('gallery'); // gallery | workspace
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalNote, setModalNote] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showConfirmToast = (message, onConfirm, onCancel) => {
    return new Promise((resolve) => {
      const id = Date.now() + Math.random();
      const toast = {
        id,
        message,
        type: 'confirm',
        duration: 0,
        showActions: true,
        onConfirm: () => {
          if (onConfirm) onConfirm();
          resolve(true);
          removeToast(id);
        },
        onCancel: () => {
          if (onCancel) onCancel();
          resolve(false);
          removeToast(id);
        },
      };
      setToasts((prev) => [...prev, toast]);
    });
  };

  // Filter notes based on search term
  const filteredNotes = notes.filter((note) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const titleMatch = (note.title || '').toLowerCase().includes(searchLower);
    const contentMatch = (note.content || '').toLowerCase().includes(searchLower);
    return titleMatch || contentMatch;
  });

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
    // Check if wallet is connected
    if (!walletState.connected || !walletInstance) {
      showToast('Please connect your wallet to create a new note', 'warning', 4000);
      return;
    }

    // Open modal for new note creation
    setModalNote(null);
    setIsModalOpen(true);
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

      // Send payment and update via backend API if not a local note
      let txHash = null;
      if (!String(noteId).startsWith('local-')) {
        try {
          txHash = await sendPaymentForOperation('UPDATE');
          console.log('Updating note in backend...');
          await noteService.updateNote(noteId, content, txHash);
          console.log('Backend update successful');
        } catch (error) {
          // Error toast already shown in sendPaymentForOperation
          throw error;
        }
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
      if (!error.message?.includes('cancelled') && !error.message?.includes('Wallet not connected')) {
        showToast(`Failed to update note: ${error.message}`, 'error', 4000);
      }
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

  const sendPaymentForOperation = async (operation) => {
    if (!walletInstance || !walletState.connected) {
      showToast('Wallet not connected. Please connect your wallet to perform this operation.', 'error', 4000);
      throw new Error('Wallet not connected. Please connect your wallet to perform this operation.');
    }

    if (!walletState.address) {
      showToast('Wallet address not available.', 'error', 4000);
      throw new Error('Wallet address not available');
    }

    // Get service address (use wallet's own address as fallback for testing)
    const serviceAddress = getServiceAddress(walletState.address);
    if (!serviceAddress) {
      showToast('Service address not configured. Please set VITE_SERVICE_ADDRESS environment variable.', 'error', 5000);
      throw new Error('Service address not configured');
    }

    const requiredAmount = paymentService.getRequiredAmount(operation);
    const balance = walletState.balanceAda;

    if (!paymentService.hasSufficientBalance(balance, operation)) {
      const errorMsg = `Insufficient balance. Required: ${requiredAmount} ADA, Available: ${balance?.toFixed(2) || 0} ADA`;
      showToast(errorMsg, 'error', 5000);
      throw new Error(errorMsg);
    }

    // Show confirmation toast
    const confirmed = await showConfirmToast(
      `This operation requires a payment of ${requiredAmount} ADA.\n\nYour balance: ${balance?.toFixed(2) || 0} ADA`,
      null,
      null
    );

    if (!confirmed) {
      showToast('Payment cancelled', 'info', 3000);
      throw new Error('Payment cancelled by user');
    }

    try {
      showToast(`Processing payment of ${requiredAmount} ADA...`, 'info', 3000);
      const txHash = await paymentService.sendPayment(walletInstance, operation, serviceAddress);
      console.log(`${operation} payment successful:`, txHash);
      showToast(`Payment successful! Transaction: ${txHash.slice(0, 8)}...`, 'success', 5000);
      return txHash;
    } catch (error) {
      console.error(`Payment failed for ${operation}:`, error);
      showToast(`Payment failed: ${error.message}`, 'error', 5000);
      throw error;
    }
  };

  const deleteNote = async (noteId) => {
		try {
      // Send payment for delete operation
      let txHash = null;
      if (!String(noteId).startsWith('local-')) {
        try {
          txHash = await sendPaymentForOperation('DELETE');
        } catch (error) {
          // Error toast already shown in sendPaymentForOperation
          return;
        }
      }

			// Call backend for non-local notes
			if (!String(noteId).startsWith('local-')) {
				await noteService.deleteNote(noteId, txHash);
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
			showToast(`Failed to delete note: ${error.message}`, 'error', 4000);
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
        // Creating new note - send payment first
        const txHash = await sendPaymentForOperation('CREATE');
        const created = await noteService.createNote(title, content, txHash);
        await loadNotes();
        if (created && created.id) {
          setSelectedNoteId(created.id);
        }
      } else {
        // Updating existing note - send payment first
        const txHash = await sendPaymentForOperation('UPDATE');
        await noteService.updateNote(noteId, content, txHash);
        await loadNotes();
        setSelectedNoteId(noteId);
      }
    } catch (err) {
      console.error('Save failed:', err);
      if (!err.message?.includes('cancelled') && !err.message?.includes('Wallet not connected')) {
        showToast(`Save failed: ${err.message}`, 'error', 4000);
      }
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
    <>
      {viewMode === 'gallery' ? (
        <NotesGallery
          notes={filteredNotes}
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
            notes={filteredNotes}
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
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}

export default NotesPage;