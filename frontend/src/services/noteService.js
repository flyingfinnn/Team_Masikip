import axios from 'axios';

// API service for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Suppress console warnings for localhost in development
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args.join(' ');
  if (message.includes('localhost') || message.includes('Localhost')) {
    return; // Suppress localhost warnings
  }
  originalWarn.apply(console, args);
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

class NoteService {
  // Create a new note
  async createNote(title, content = '', transactionHash = null) {
    const requestData = {
      title: title,
      content: content,
      ...(transactionHash && { transactionHash })
    };

    console.log('Creating note with data:', requestData);

    console.log('CREATE_NOTE Transaction:', {
      type: 'CREATE_NOTE',
      title: title,
      content: content,
      timestamp: Date.now(),
      transactionHash: transactionHash || `hash-${Date.now()}`
    });

    const { data } = await api.post('/notes', requestData);
    console.log('Create note result:', data);
    return data;
  }

  // Get all notes
  async getAllNotes() {
    const { data } = await api.get('/notes');
    return data;
  }

  // Update note content
  async updateNote(noteId, content, transactionHash = null) {
    console.log('noteService.updateNote called with:', { noteId, content });

    if (!noteId || noteId === 'undefined') {
      throw new Error('Invalid noteId: ' + noteId);
    }

    const requestData = {
      content: content,
      ...(transactionHash && { transactionHash })
    };

    console.log('UPDATE_NOTE Transaction:', {
      type: 'UPDATE_NOTE',
      noteId: noteId,
      content: content,
      timestamp: Date.now(),
      transactionHash: transactionHash || `hash-${Date.now()}`
    });

    const { data } = await api.put(`/notes/${noteId}`, requestData);
    return data;
  }

  // Update note priority (isPinned status)
  async updateNotePriority(noteId, isPinned) {
    console.log('updateNotePriority called with:', { noteId, isPinned });

    if (!noteId || noteId === 'undefined') {
      throw new Error('Invalid noteId for priority update: ' + noteId);
    }

    // Send both keys to be robust against DTO naming (pinned vs isPinned)
    const requestData = {
      pinned: isPinned,
      isPinned: isPinned
    };

    console.log('SET_PRIORITY Transaction:', {
      type: 'SET_PRIORITY',
      noteId: noteId,
      isPinned: isPinned,
      priority: isPinned ? 'High' : 'Medium',
      timestamp: Date.now(),
      blockHash: `hash-${Date.now()}`
    });

    const { data } = await api.patch(`/notes/${noteId}/priority`, requestData);
    return data;
  }

  // Alternative method to update priority directly (if you want to add this endpoint later)
  async updateNotePriorityDirect(noteId, priority) {
    console.log('updateNotePriorityDirect called with:', { noteId, priority });

    if (!noteId || noteId === 'undefined') {
      throw new Error('Invalid noteId for priority update: ' + noteId);
    }

    const requestData = {
      priority: priority
    };

    const { data } = await api.patch(`/notes/${noteId}/priority-direct`, requestData);
    return data;
  }

  // Delete a note
  async deleteNote(noteId, transactionHash = null) {
    console.log('DELETE_NOTE Transaction:', {
      type: 'DELETE_NOTE',
      noteId: noteId,
      timestamp: Date.now(),
      transactionHash: transactionHash || `hash-${Date.now()}`
    });

    const config = transactionHash ? {
      data: { transactionHash }
    } : {};
    
    await api.delete(`/notes/${noteId}`, config);
    return null;
  }

  // Transform backend note to frontend format
  transformNote(backendNote) {
    console.log('Raw backend note:', JSON.stringify(backendNote, null, 2));

    if (!backendNote) {
      throw new Error('Backend note is null or undefined');
    }

    // Your backend uses 'noteId' not 'id'
    const noteId = backendNote.noteId || backendNote.id;
    if (!noteId) {
      console.error('Backend note missing noteId:', backendNote);
      throw new Error('Backend note missing noteId');
    }

    const now = new Date();
    // Your backend uses 'updatedAt' not 'lastModified'
    const noteDate = new Date(backendNote.updatedAt || backendNote.createdAt || now);

    console.log('Backend isActive value:', backendNote.isActive, 'type:', typeof backendNote.isActive);
    console.log('Backend active field:', backendNote.active, 'type:', typeof backendNote.active);

    // Handle different possible field names for active status
    const isActive = backendNote.isActive !== undefined ? backendNote.isActive : backendNote.active;
    const isDeleted = isActive === false;

    console.log('Final isActive:', isActive, 'isDeleted:', isDeleted);

    const transformed = {
      id: noteId, // Map noteId to id for frontend
      title: (backendNote.title || 'Untitled').toUpperCase(),
      content: backendNote.content || '',
      preview: this.generatePreview(backendNote.content || ''),
      date: noteDate.toLocaleDateString(),
      time: noteDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date(backendNote.createdAt || now).getTime(),
      lastModified: new Date(backendNote.updatedAt || now).getTime(),
      // isPinned is separate from priority - use explicit pinned field or default to false
      isPinned: backendNote.pinned === true,
      priority: backendNote.priority || 'Medium',
      isDeleted: isDeleted, // Use calculated value
      isSelected: false,
      tags: backendNote.tags || [],
      deletedAt: isDeleted ? new Date(backendNote.updatedAt || now).getTime() : undefined,
      transactionHash: backendNote.transactionHash || backendNote.transaction_hash || null // Include transaction hash for confirmation checking
    };

    console.log('Transformed note:', transformed);
    return transformed;
  }

  // Generate preview from content
  generatePreview(content) {
    if (!content) return '';

    const lines = content.split('\n');
    const contentWithoutTitle = lines.slice(1).join('\n').trim();
    return contentWithoutTitle.slice(0, 100) + (contentWithoutTitle.length > 100 ? '...' : '');
  }

  // Transform frontend priority to backend isPinned (for API compatibility)
  // Note: Priority is now independent of pinned status
  priorityToPinned(priority) {
    // Pinned status is now managed separately, not derived from priority
    return false;
  }

  // Transform backend priority to frontend priority
  backendPriorityToFrontend(backendPriority) {
    // Use the actual priority from backend, fallback to Medium
    return backendPriority || 'Medium';
  }

  // Transform backend isPinned to frontend priority (for API responses)
  // Note: Priority is now independent of pinned status
  pinnedToPriority(isPinned) {
    // Don't automatically set priority based on pin status
    return 'Medium';
  }
}

// Export a singleton instance
export default new NoteService();