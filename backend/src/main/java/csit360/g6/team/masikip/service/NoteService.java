
package csit360.g6.team.masikip.service;

import csit360.g6.team.masikip.model.ActionType;
import csit360.g6.team.masikip.model.Note;
import csit360.g6.team.masikip.model.NoteTransaction;
import csit360.g6.team.masikip.repository.NoteRepository;
import csit360.g6.team.masikip.repository.NoteTransactionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NoteService {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private NoteTransactionRepository noteTransactionRepository;

    /**
     * Creates a new note and logs the creation as the first transaction in its history.
     * This method is transactional, meaning both operations (creating the note and its transaction log)
     * must succeed together. If one fails, the other is rolled back.
     */

    @Transactional
    public Note createNote(String title, String content) {
        Note newNote = new Note();
        newNote.setTitle(title);
        newNote.setContent(content);
        newNote.setCreatedAt(LocalDateTime.now());
        newNote.setUpdatedAt(LocalDateTime.now());
        newNote.setActive(true);
        newNote.setPriority("Medium");
        newNote.setPinned(false); // Initialize isPinned to false

        Note savedNote = noteRepository.save(newNote);

        NoteTransaction transaction = new NoteTransaction();
        transaction.setNoteId(savedNote.getNoteId());
        transaction.setActionType(ActionType.CREATE_NOTE);
        transaction.setContentBefore(null);
        transaction.setContentAfter(content);
        transaction.setTimestamp(LocalDateTime.now());
        transaction.setMetadata("Note created with title: '" + title + "'");

        noteTransactionRepository.save(transaction);

        return savedNote;
    }

    public List<Note> getAllActiveNotes() {
        return noteRepository.findByIsActiveTrue();
    }

    @Transactional
    public Note updateNote(Long noteId, String newContent) {
        Note existingNote = noteRepository.findById(noteId)
                .orElseThrow(() -> new EntityNotFoundException("Note not found with id: " + noteId));

        String contentBefore = existingNote.getContent();
        existingNote.setContent(newContent);

        String newTitle = newContent.split("\n")[0];
        existingNote.setTitle(newTitle.length() > 255 ? newTitle.substring(0, 255) : newTitle);
        existingNote.setUpdatedAt(LocalDateTime.now());

        Note updatedNote = noteRepository.save(existingNote);

        NoteTransaction transaction = new NoteTransaction();
        transaction.setNoteId(noteId);
        transaction.setActionType(ActionType.UPDATE_NOTE);
        transaction.setContentBefore(contentBefore);
        transaction.setContentAfter(newContent);
        transaction.setTimestamp(LocalDateTime.now());
        transaction.setMetadata("Note content updated.");

        noteTransactionRepository.save(transaction);

        return updatedNote;
    }

    @Transactional
    public void deleteNote(Long noteId) {
        Note noteToDelete = noteRepository.findById(noteId)
                .orElseThrow(() -> new EntityNotFoundException("Note not found with id: " + noteId));

        noteToDelete.setActive(false);
        noteToDelete.setUpdatedAt(LocalDateTime.now());
        noteRepository.save(noteToDelete);

        NoteTransaction transaction = new NoteTransaction();
        transaction.setNoteId(noteId);
        transaction.setActionType(ActionType.DELETE_NOTE);
        transaction.setContentBefore(noteToDelete.getContent());
        transaction.setContentAfter(null);
        transaction.setTimestamp(LocalDateTime.now());
        transaction.setMetadata("Note marked as deleted.");
        noteTransactionRepository.save(transaction);
    }

    @Transactional
    public Note updateNotePriority(Long noteId, boolean isPinned) {
        Note noteToUpdate = noteRepository.findById(noteId)
                .orElseThrow(() -> new EntityNotFoundException("Note not found with id: " + noteId));

        String oldPriority = noteToUpdate.getPriority();
        String newPriority = isPinned ? "High" : "Medium";

        noteToUpdate.setPriority(newPriority);
        noteToUpdate.setUpdatedAt(LocalDateTime.now());

        Note updatedNote = noteRepository.save(noteToUpdate);

        NoteTransaction transaction = new NoteTransaction();
        transaction.setNoteId(noteId);
        transaction.setActionType(ActionType.SET_PRIORITY);
        transaction.setTimestamp(LocalDateTime.now());
        transaction.setMetadata("Priority changed from '" + oldPriority + "' to '" + newPriority + "'");

        noteTransactionRepository.save(transaction);

        return updatedNote;
    }
}