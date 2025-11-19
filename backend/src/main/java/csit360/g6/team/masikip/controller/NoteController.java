
package csit360.g6.team.masikip.controller;

import csit360.g6.team.masikip.dto.CreateNoteRequest;
import csit360.g6.team.masikip.dto.UpdateNotePriorityRequest;
import csit360.g6.team.masikip.dto.UpdateNoteRequest;
import csit360.g6.team.masikip.model.Note;
import csit360.g6.team.masikip.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "*") 
public class NoteController {

    @Autowired
    private NoteService noteService;

    @PostMapping
    public ResponseEntity<Note> createNote(@RequestBody CreateNoteRequest request) {
        Note createdNote = noteService.createNote(request.getTitle(), request.getContent());
        return new ResponseEntity<>(createdNote, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Note>> getAllNotes() {
        List<Note> notes = noteService.getAllActiveNotes();
        return ResponseEntity.ok(notes);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Note> updateNote(@PathVariable Long id, @RequestBody UpdateNoteRequest request) {
        Note updatedNote = noteService.updateNote(id, request.getContent());
        return ResponseEntity.ok(updatedNote);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long id) {
        noteService.deleteNote(id);
        return ResponseEntity.noContent().build(); // Standard successful response for a DELETE request
    }

    @PatchMapping("/{id}/priority")
    public ResponseEntity<Note> updateNotePriority(@PathVariable Long id, @RequestBody UpdateNotePriorityRequest request) {
        Note updatedNote = noteService.updateNotePriority(id, request.isPinned());
        return ResponseEntity.ok(updatedNote);
    }
}