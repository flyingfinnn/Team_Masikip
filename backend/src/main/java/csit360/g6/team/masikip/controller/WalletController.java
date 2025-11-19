package csit360.g6.team.masikip.controller;

import csit360.g6.team.masikip.model.NoteTransaction;
import csit360.g6.team.masikip.repository.NoteTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/wallet")
@CrossOrigin(origins = "*")
public class WalletController {

    @Autowired
    private NoteTransactionRepository noteTransactionRepository;

    @GetMapping("/transactions")
    public ResponseEntity<List<NoteTransaction>> getAllTransactions() {
        // In a real app, we might filter by wallet address, but for this demo we show all
        List<NoteTransaction> transactions = noteTransactionRepository.findAll();
        // Sort by timestamp descending
        transactions.sort((t1, t2) -> t2.getTimestamp().compareTo(t1.getTimestamp()));
        return ResponseEntity.ok(transactions);
    }
}
