package csit360.g6.team.masikip.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UpdateNotePriorityRequest {

    @JsonProperty("isPinned")
    private boolean pinned;

    public boolean isPinned() {
        return pinned;
    }

    public void setPinned(boolean pinned) {
        this.pinned = pinned;
    }
}