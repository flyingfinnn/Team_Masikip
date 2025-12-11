package csit360.g6.team.masikip.controller;

import csit360.g6.team.masikip.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/restore")
@CrossOrigin(origins = "*") // Allow requests from frontend
public class RestoreController {

    @Autowired
    private NoteService noteService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> restoreFromBlockchain(@RequestBody Map<String, String> payload) {
        String walletAddress = payload.get("walletAddress");
        Map<String, Object> response = new HashMap<>();

        if (walletAddress == null || walletAddress.isEmpty()) {
            response.put("error", "Wallet address is required");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            int restoredCount = noteService.restoreNotesFromBlockchain(walletAddress);
            response.put("message", "Restoration completed");
            response.put("restoredCount", restoredCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", "Restoration failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
