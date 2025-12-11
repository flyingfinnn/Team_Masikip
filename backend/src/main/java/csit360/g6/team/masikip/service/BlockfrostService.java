package csit360.g6.team.masikip.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BlockfrostService {

    @Value("${blockfrost.project.id}")
    private String projectId;

    @Value("${blockfrost.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Check if transaction is confirmed on blockchain
     * 
     * @param txHash Transaction hash
     * @return "confirmed" if on-chain, "pending" if not found, "unknown" if error
     */
    public String checkTransactionStatus(String txHash) {
        try {
            System.out.println("🔍 Checking transaction status: " + txHash);

            String url = apiUrl + "/txs/" + txHash;

            HttpHeaders headers = new HttpHeaders();
            headers.set("project_id", projectId);

            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class);

            // 200 OK = transaction is on-chain
            if (response.getStatusCode() == HttpStatus.OK) {
                System.out.println("✅ Transaction confirmed: " + txHash);
                return "confirmed";
            }

            return "unknown";

        } catch (HttpClientErrorException.NotFound e) {
            // 404 = transaction not yet confirmed
            System.out.println("⏳ Transaction pending: " + txHash);
            return "pending";
        } catch (Exception e) {
            System.err.println("❌ Blockfrost API error: " + e.getMessage());
            return "unknown";
        }
    }

    /**
     * Check if transaction is confirmed (boolean version)
     * 
     * @param txHash Transaction hash
     * @return true if confirmed, false otherwise
     */
    public boolean isTransactionConfirmed(String txHash) {
        return "confirmed".equals(checkTransactionStatus(txHash));
    }

    /**
     * Get transaction history for an address
     */
    public List<String> getAddressTransactions(String address) {
        try {
            String url = apiUrl + "/addresses/" + address + "/transactions?order=desc";
            HttpHeaders headers = new HttpHeaders();
            headers.set("project_id", projectId);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<List> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    List.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<Map<String, Object>> txs = response.getBody();
                return txs.stream()
                        .map(tx -> (String) tx.get("tx_hash"))
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to fetch address transactions: " + e.getMessage());
        }
        return Collections.emptyList();
    }

    /**
     * Get transaction metadata
     */
    public List<Map<String, Object>> getTransactionMetadata(String txHash) {
        try {
            String url = apiUrl + "/txs/" + txHash + "/metadata";
            HttpHeaders headers = new HttpHeaders();
            headers.set("project_id", projectId);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<List> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    List.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            }
        } catch (Exception e) {
            // 404 means no metadata, which is fine
        }
        return Collections.emptyList();
    }
}
