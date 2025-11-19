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

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class NoteService {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private NoteTransactionRepository noteTransactionRepository;

    @Transactional
    public Note createNote(String title, String content, String walletAddress) {
        Note newNote = new Note();
        newNote.setTitle(title);
        newNote.setContent(content);
        newNote.setCreatedAt(LocalDateTime.now());
        newNote.setUpdatedAt(LocalDateTime.now());
        newNote.setActive(true);
        newNote.setPriority("Medium");

        Note savedNote = noteRepository.save(newNote);

        createTransaction(savedNote.getNoteId(), ActionType.CREATE_NOTE, null, content, "Note created with title: '" + title + "'", walletAddress);

        return savedNote;
    }

    public List<Note> getAllActiveNotes() {
        return noteRepository.findByIsActiveTrue();
    }

    @Transactional
    public Note updateNote(Long noteId, String newContent, String walletAddress) {
        Note existingNote = noteRepository.findById(noteId)
                .orElseThrow(() -> new EntityNotFoundException("Note not found with id: " + noteId));

        String contentBefore = existingNote.getContent();
        existingNote.setContent(newContent);

        String newTitle = newContent.split("\n")[0];
        existingNote.setTitle(newTitle.length() > 255 ? newTitle.substring(0, 255) : newTitle);
        existingNote.setUpdatedAt(LocalDateTime.now());

        Note updatedNote = noteRepository.save(existingNote);

        createTransaction(noteId, ActionType.UPDATE_NOTE, contentBefore, newContent, "Note content updated.", walletAddress);

        return updatedNote;
    }

    @Transactional
    public void deleteNote(Long noteId, String walletAddress) {
        Note noteToDelete = noteRepository.findById(noteId)
                .orElseThrow(() -> new EntityNotFoundException("Note not found with id: " + noteId));

        noteToDelete.setActive(false);
        noteToDelete.setUpdatedAt(LocalDateTime.now());
        noteRepository.save(noteToDelete);

        createTransaction(noteId, ActionType.DELETE_NOTE, noteToDelete.getContent(), null, "Note marked as deleted.", walletAddress);
    }

    @Transactional
    public Note updateNotePriority(Long noteId, boolean isPinned, String walletAddress) {
        Note noteToUpdate = noteRepository.findById(noteId)
                .orElseThrow(() -> new EntityNotFoundException("Note not found with id: " + noteId));

        String oldPriority = noteToUpdate.getPriority();
        String newPriority = isPinned ? "High" : "Medium";

        noteToUpdate.setPriority(newPriority);
        noteToUpdate.setUpdatedAt(LocalDateTime.now());

        Note updatedNote = noteRepository.save(noteToUpdate);

        createTransaction(noteId, ActionType.SET_PRIORITY, null, null, "Priority changed from '" + oldPriority + "' to '" + newPriority + "'", walletAddress);

        return updatedNote;
    }

    private void createTransaction(Long noteId, ActionType actionType, String contentBefore, String contentAfter, String metadata, String walletAddress) {
        NoteTransaction transaction = new NoteTransaction();
        transaction.setNoteId(noteId);
        transaction.setActionType(actionType);
        transaction.setContentBefore(contentBefore);
        transaction.setContentAfter(contentAfter);
        transaction.setTimestamp(LocalDateTime.now());
        transaction.setMetadata(metadata);
        transaction.setWalletAddress(walletAddress);

        String previousHash = "0000000000000000000000000000000000000000000000000000000000000000"; 
        
        NoteTransaction lastTransaction = noteTransactionRepository.findTopByOrderByTimestampDesc();
        if (lastTransaction != null && lastTransaction.getBlockHash() != null) {
            previousHash = lastTransaction.getBlockHash();
        }
        
        String dataToHash = previousHash + noteId + actionType.toString() + transaction.getTimestamp().toString() + (contentAfter != null ? contentAfter : "");
        String blockHash = calculateHash(dataToHash);
        
        transaction.setBlockHash(blockHash);
        transaction.setPreviousHash(previousHash);
        
        noteTransactionRepository.save(transaction);
    }

    private String calculateHash(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (int i = 0; i < encodedhash.length; i++) {
                String hex = Integer.toHexString(0xff & encodedhash[i]);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error calculating hash", e);
        }
    }
}