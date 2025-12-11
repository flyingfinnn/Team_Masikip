package csit360.g6.team.masikip.service;

import csit360.g6.team.masikip.model.Note;
import csit360.g6.team.masikip.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransactionSyncService {

    private final NoteRepository noteRepository;
    private final BlockfrostService blockfrostService;

    @Autowired
    public TransactionSyncService(NoteRepository noteRepository, BlockfrostService blockfrostService) {
        this.noteRepository = noteRepository;
        this.blockfrostService = blockfrostService;
    }

    /**
     * Periodically check for pending transactions and update their status.
     * Runs every 20 seconds (20000 ms).
     */
    @Scheduled(fixedRate = 20000)
    public void syncPendingTransactions() {
        System.out.println("🔄 [Sync Worker] Checking for pending transactions...");

        // 1. Query local database for all notes with status = 'pending'
        List<Note> pendingNotes = noteRepository.findByStatus("pending");

        if (pendingNotes.isEmpty()) {
            System.out.println("   [Sync Worker] No pending transactions found.");
            return;
        }

        System.out.println("   [Sync Worker] Found " + pendingNotes.size() + " pending note(s).");

        for (Note note : pendingNotes) {
            String txHash = note.getTransactionHash();

            // Skip notes without a transaction hash (can't check them)
            if (txHash == null || txHash.isEmpty()) {
                System.out.println(
                        "   ⚠️ Note ID " + note.getNoteId() + " has 'pending' status but no transaction hash.");
                continue;
            }

            // 2. Query Blockfrost API
            System.out.println("   🔎 Checking Hash: " + txHash);
            String status = blockfrostService.checkTransactionStatus(txHash);

            // 3. Update status if confirmed
            if ("confirmed".equals(status)) {
                System.out.println("   ✅ Transaction confirmed! Updating Note ID " + note.getNoteId());
                note.setStatus("confirmed");
                noteRepository.save(note);
            } else if ("pending".equals(status)) {
                System.out.println("   ⏳ Transaction still pending for Note ID " + note.getNoteId());
            } else {
                System.out.println("   ❓ Unknown status for Note ID " + note.getNoteId());
            }
        }
    }
}
