package csit360.g6.team.masikip.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

@Service
public class IPFSService {

    @Value("${blockfrost.ipfs.key}")
    private String ipfsApiKey;

    @Value("${ipfs.gateway.url:https://ipfs.blockfrost.io/api/v0}")
    private String ipfsApiBase;

    private final RestTemplate restTemplate;
    private static final String IPFS_ADD_URL = "https://ipfs.blockfrost.io/api/v0/ipfs/add";
    
    public IPFSService() {
        this.restTemplate = new RestTemplate();
        // Configure timeout for large file uploads (5 minutes)
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) TimeUnit.SECONDS.toMillis(30));
        factory.setReadTimeout((int) TimeUnit.MINUTES.toMillis(5));
        this.restTemplate.setRequestFactory(factory);
    }

    /**
     * Upload content to IPFS via Blockfrost
     * 
     * @param content The note content to upload
     * @return IPFS hash (CID)
     */
    public String uploadToIPFS(String content) {
        try {
            System.out.println("📤 Uploading to IPFS...");

            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.set("project_id", ipfsApiKey);
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            // Prepare body with file
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource fileResource = new ByteArrayResource(content.getBytes(StandardCharsets.UTF_8)) {
                @Override
                public String getFilename() {
                    return "note.txt";
                }
            };
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            // Upload to IPFS
            ResponseEntity<IPFSResponse> response = restTemplate.postForEntity(
                    IPFS_ADD_URL,
                    requestEntity,
                    IPFSResponse.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String ipfsHash = response.getBody().getIpfs_hash();
                System.out.println("✅ Uploaded to IPFS: " + ipfsHash);
                return ipfsHash;
            }

            throw new RuntimeException("Failed to upload to IPFS");

        } catch (Exception e) {
            System.err.println("❌ IPFS upload error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to upload to IPFS: " + e.getMessage(), e);
        }
    }

    /**
     * Retrieve content from IPFS via Blockfrost
     * 
     * @param ipfsHash The IPFS hash (CID)
     * @return The note content
     */
    public String retrieveFromIPFS(String ipfsHash) {
        try {
            System.out.println("📥 Retrieving from IPFS: " + ipfsHash);

            String url = ipfsApiBase + "/ipfs/gateway/" + ipfsHash;

            HttpHeaders headers = new HttpHeaders();
            headers.set("project_id", ipfsApiKey);

            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                String content = response.getBody();
                System.out.println("✅ Retrieved from IPFS: " +
                        (content != null && content.length() > 50 ? content.substring(0, 50) + "..." : content));
                return content;
            }

            throw new RuntimeException("Failed to retrieve from IPFS");

        } catch (Exception e) {
            System.err.println("❌ IPFS retrieval error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to retrieve from IPFS: " + e.getMessage(), e);
        }
    }

    /**
     * Pin content to IPFS for persistence (optional)
     * 
     * @param ipfsHash The IPFS hash to pin
     * @return Success status
     */
    public boolean pinToIPFS(String ipfsHash) {
        try {
            System.out.println("📌 Pinning to IPFS: " + ipfsHash);

            String url = ipfsApiBase + "/ipfs/pin/add/" + ipfsHash;

            HttpHeaders headers = new HttpHeaders();
            headers.set("project_id", ipfsApiKey);

            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    url,
                    entity,
                    String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                System.out.println("✅ Pinned to IPFS");
                return true;
            }

            return false;

        } catch (Exception e) {
            System.out.println("⚠️ IPFS pinning failed: " + e.getMessage());
            return false;
        }
    }

    // Response class for IPFS upload
    private static class IPFSResponse {
        private String name;
        private String ipfs_hash;
        private String size;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getIpfs_hash() {
            return ipfs_hash;
        }

        public void setIpfs_hash(String ipfs_hash) {
            this.ipfs_hash = ipfs_hash;
        }

        public String getSize() {
            return size;
        }

        public void setSize(String size) {
            this.size = size;
        }
    }
}
