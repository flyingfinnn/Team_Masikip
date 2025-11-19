package csit360.g6.team.masikip.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "note_transactions")
public class NoteTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long transactionId;

    @Column(nullable = false)
    private Long noteId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActionType actionType; // CREATE_NOTE, UPDATE_NOTE

    @Column(columnDefinition = "TEXT")
    private String contentBefore;

    @Column(columnDefinition = "TEXT")
    private String contentAfter;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    private String metadata; // Optional field for other data (e.g., priority change, style)


    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public Long getNoteId() {
        return noteId;
    }

    public void setNoteId(Long noteId) {
        this.noteId = noteId;
    }

    public ActionType getActionType() {
        return actionType;
    }

    public void setActionType(ActionType actionType) {
        this.actionType = actionType;
    }

    public String getContentBefore() {
        return contentBefore;
    }

    public void setContentBefore(String contentBefore) {
        this.contentBefore = contentBefore;
    }

    public String getContentAfter() {
        return contentAfter;
    }

    public void setContentAfter(String contentAfter) {
        this.contentAfter = contentAfter;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }
}


