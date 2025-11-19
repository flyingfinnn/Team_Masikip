package csit360.g6.team.masikip.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UpdateNotePriorityRequest {

    @JsonProperty("isPinned")
    private boolean pinned;

    private String walletAddress;

    public boolean isPinned() {
        return pinned;
    }

    public void setPinned(boolean pinned) {
        this.pinned = pinned;
    }

    public String getWalletAddress() {
        return walletAddress;
    }

    public void setWalletAddress(String walletAddress) {
        this.walletAddress = walletAddress;
    }
}