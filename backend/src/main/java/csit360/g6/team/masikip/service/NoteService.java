
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
import java.util.*;

@Service
public class NoteService {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private NoteTransactionRepository noteTransactionRepository;

    @Autowired
    private IPFSService ipfsService;

    @Autowired
    private BlockfrostService blockfrostService;

    /**
     * Creates a new note and logs the creation as the first transaction in its
     * history.
     * This method is transactional, meaning both operations (creating the note and
     * its transaction log)
     * must succeed together. If one fails, the other is rolled back.
     */

    @Transactional
    public Note createNote(String title, String content, String transactionHash) {
        // Validate input
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Note title cannot be empty");
        }
        if (content == null) {
            content = ""; // Allow empty content but not null
        }

        // Upload content to IPFS
        String ipfsHash;
        try {
            ipfsHash = ipfsService.uploadToIPFS(content);
        } catch (Exception e) {
            System.err.println("❌ Failed to upload to IPFS: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to upload note to IPFS: " + e.getMessage(), e);
        }

        Note newNote = new Note();
        newNote.setTitle(title);
        newNote.setContent(content); // Keep content for backward compatibility
        newNote.setIpfsHash(ipfsHash); // Store IPFS hash
        newNote.setTransactionHash(transactionHash);
        newNote.setStatus("pending"); // Initial status
        newNote.setCreatedAt(LocalDateTime.now());
        newNote.setUpdatedAt(LocalDateTime.now());
        newNote.setActive(true);
        newNote.setPriority("Medium");

        Note savedNote = noteRepository.save(newNote);

        NoteTransaction transaction = new NoteTransaction();
        transaction.setNoteId(savedNote.getNoteId());
        transaction.setActionType(ActionType.CREATE_NOTE);
        transaction.setContentBefore(null);
        transaction.setContentAfter(content);
        transaction.setTimestamp(LocalDateTime.now());

        // Build metadata string, truncate title if too long to prevent issues
        String truncatedTitle = title != null && title.length() > 200 ? title.substring(0, 200) + "..." : title;
        String metadata = "Note created with title: '" + truncatedTitle + "' | IPFS: " + ipfsHash;
        if (transactionHash != null && !transactionHash.isEmpty()) {
            metadata += " | TX: " + transactionHash;
        }
        transaction.setMetadata(metadata);

        noteTransactionRepository.save(transaction);

        return savedNote;
    }

    // Backward compatibility - createNote without transaction hash
    @Transactional
    public Note createNote(String title, String content) {
        return createNote(title, content, null);
    }

    public List<Note> getAllActiveNotes() {
        // Return notes as-is without IPFS retrieval
        // IPFS retrieval should only happen when fetching individual notes
        // This prevents errors for old notes without IPFS hashes
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

    /**
     * Get note by ID with content from IPFS (if available)
     */
    public Note getNoteById(Long noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new EntityNotFoundException("Note not found with id: " + noteId));

        // If IPFS hash exists, try to retrieve content from IPFS
        if (note.getIpfsHash() != null && !note.getIpfsHash().isEmpty()) {
            try {
                String ipfsContent = ipfsService.retrieveFromIPFS(note.getIpfsHash());
                note.setContent(ipfsContent); // Update content from IPFS
            } catch (Exception e) {
                System.err.println("Failed to retrieve from IPFS, using stored content: " + e.getMessage());
                // Fall back to stored content if IPFS retrieval fails
            }
        }

        return note;
    }

    /**
     * Update pending transaction statuses using Blockfrost
     */
    @Transactional
    public void updatePendingTransactionStatuses() {
        try {
            List<Note> pendingNotes = noteRepository.findByStatus("pending");
            System.out.println("🔄 Checking " + pendingNotes.size() + " pending transactions...");

            for (Note note : pendingNotes) {
                if (note.getTransactionHash() != null && !note.getTransactionHash().isEmpty()) {
                    // Check blockchain transaction status
                    try {
                        String status = blockfrostService.checkTransactionStatus(note.getTransactionHash());

                        if ("confirmed".equals(status)) {
                            note.setStatus("confirmed");
                            noteRepository.save(note);
                            System.out.println("✅ Note " + note.getNoteId() + " confirmed via blockchain");
                        }
                    } catch (Exception e) {
                        System.err.println(
                                "❌ Failed to check blockchain status for note " + note.getNoteId() + ": "
                                        + e.getMessage());
                    }
                } else {
                    // No transaction hash - automatically confirm for development/testing
                    note.setStatus("confirmed");
                    noteRepository.save(note);
                    System.out.println("✅ Note " + note.getNoteId() + " auto-confirmed (no transaction hash)");
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error in updatePendingTransactionStatuses: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Restore notes from blockchain for a specific wallet address
     */
    @Transactional
    public int restoreNotesFromBlockchain(String walletAddress) {
        System.out.println("🔄 Starting blockchain restoration for address: " + walletAddress);
        int restoredCount = 0;

        try {
            // 1. Get all transactions for the address
            List<String> txHashes = blockfrostService.getAddressTransactions(walletAddress);
            System.out.println("📝 Found " + txHashes.size() + " transactions on-chain");

            for (String txHash : txHashes) {
                // 2. Check if we already have this transaction linked to a note
                // Use a custom query if performance becomes an issue, but for now simple check
                // is fine
                boolean exists = false;
                List<Note> allNotes = noteRepository.findAll();
                for (Note n : allNotes) {
                    if (txHash.equals(n.getTransactionHash())) {
                        exists = true;
                        break;
                    }
                }

                if (exists) {
                    continue; // Skip if already exists
                }

                // 3. Fetch metadata for the transaction
                List<Map<String, Object>> metadataList = blockfrostService.getTransactionMetadata(txHash);

                // 4. Parse metadata to find our Note data
                // Structure expected: Label 42819 -> JSON Object
                // { action, title, content, ipfs_hash, ... }

                for (Map<String, Object> meta : metadataList) {
                    // Check for our custom application label
                    if ("42819".equals(String.valueOf(meta.get("label")))) {
                        Object jsonMetadata = meta.get("json_metadata");

                        if (jsonMetadata instanceof Map) {
                            Map<String, Object> jsonMap = (Map<String, Object>) jsonMetadata;

                            // Check if this is a valid note transaction
                            String action = (String) jsonMap.get("action");
                            if (action == null)
                                continue; // Not a note transaction we recognize

                            try {
                                // Extract and Reassemble Content
                                String title = extractStringContent(jsonMap.get("title"));
                                String content = extractStringContent(jsonMap.get("content"));
                                String ipfsHash = extractStringContent(jsonMap.get("ipfs_hash"));

                                // Default title if missing
                                if (title == null || title.isEmpty()) {
                                    title = content.split("\n")[0];
                                    if (title.length() > 50)
                                        title = title.substring(0, 50) + "...";
                                }

                                // Create restored note
                                Note restoredNote = new Note();
                                restoredNote.setTransactionHash(txHash);
                                restoredNote.setIpfsHash(ipfsHash);
                                restoredNote.setTitle(title);
                                restoredNote.setContent(content);
                                restoredNote.setStatus("confirmed");
                                restoredNote.setActive(!"DELETE".equalsIgnoreCase(action)); // Mark deleted notes as
                                                                                            // inactive

                                // Set timestamp (approximate from now if not in metadata)
                                String tsStr = extractStringContent(jsonMap.get("timestamp"));
                                if (tsStr != null && !tsStr.isEmpty()) {
                                    try {
                                        long epoch = Long.parseLong(tsStr);
                                        restoredNote.setCreatedAt(new java.sql.Timestamp(epoch).toLocalDateTime());
                                    } catch (Exception e) {
                                    }
                                }
                                if (restoredNote.getCreatedAt() == null) {
                                    restoredNote.setCreatedAt(LocalDateTime.now());
                                }
                                restoredNote.setUpdatedAt(restoredNote.getCreatedAt());
                                restoredNote.setPriority("Medium");

                                noteRepository.save(restoredNote);

                                // Create transaction log
                                NoteTransaction trans = new NoteTransaction();
                                trans.setNoteId(restoredNote.getNoteId());
                                trans.setActionType(ActionType.valueOf(action.toUpperCase() + "_NOTE"));
                                trans.setContentAfter(content);
                                trans.setTimestamp(LocalDateTime.now());
                                trans.setMetadata("Restored from Blockchain (Label 42819)");
                                noteTransactionRepository.save(trans);

                                restoredCount++;
                                System.out.println(
                                        "♻️ Restored note " + restoredNote.getNoteId() + " from TX: " + txHash);

                            } catch (Exception e) {
                                System.err.println("Failed to parse metadata for TX " + txHash + ": " + e.getMessage());
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Restoration failed: " + e.getMessage());
            e.printStackTrace();
        }

        return restoredCount;
    }

    /**
     * Helper to extract content that might be a string or a list of strings
     * (chunked)
     */
    private String extractStringContent(Object obj) {
        if (obj == null)
            return "";
        if (obj instanceof String)
            return (String) obj;
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            StringBuilder sb = new StringBuilder();
            for (Object item : list) {
                if (item != null)
                    sb.append(item.toString());
            }
            return sb.toString();
        }
        return obj.toString();
    }
}