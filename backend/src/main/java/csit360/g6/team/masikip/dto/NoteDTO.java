package csit360.g6.team.masikip.dto;

import java.time.LocalDateTime;

public class NoteDTO {
    private Long noteId;
    private String title;
    private String content; // Retrieved from IPFS
    private String ipfsHash;
    private String transactionHash;
    private String status;
    private String priority;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public NoteDTO() {
    }

    public NoteDTO(Long noteId, String title, String content, String ipfsHash,
            String transactionHash, String status, String priority,
            LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.noteId = noteId;
        this.title = title;
        this.content = content;
        this.ipfsHash = ipfsHash;
        this.transactionHash = transactionHash;
        this.status = status;
        this.priority = priority;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public Long getNoteId() {
        return noteId;
    }

    public void setNoteId(Long noteId) {
        this.noteId = noteId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getIpfsHash() {
        return ipfsHash;
    }

    public void setIpfsHash(String ipfsHash) {
        this.ipfsHash = ipfsHash;
    }

    public String getTransactionHash() {
        return transactionHash;
    }

    public void setTransactionHash(String transactionHash) {
        this.transactionHash = transactionHash;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
