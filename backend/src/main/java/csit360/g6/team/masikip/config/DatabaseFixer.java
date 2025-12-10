package csit360.g6.team.masikip.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import jakarta.annotation.PostConstruct;

@Configuration
public class DatabaseFixer {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void fixDatabaseSchema() {
        try {
            System.out.println("🔧 DatabaseFixer: Fixing column types...");

            // Force the content column to be TEXT (unlimited length)
            jdbcTemplate.execute("ALTER TABLE notes ALTER COLUMN content TYPE TEXT");
            System.out.println("✅ DatabaseFixer: Successfully altered 'content' column to TEXT!");

            // Force the title column to be TEXT (unlimited length)
            jdbcTemplate.execute("ALTER TABLE notes ALTER COLUMN title TYPE TEXT");
            System.out.println("✅ DatabaseFixer: Successfully altered 'title' column to TEXT!");

            // Force the metadata column in note_transactions to be TEXT (unlimited length)
            jdbcTemplate.execute("ALTER TABLE note_transactions ALTER COLUMN metadata TYPE TEXT");
            System.out.println("✅ DatabaseFixer: Successfully altered 'note_transactions.metadata' column to TEXT!");
        } catch (Exception e) {
            System.err.println("⚠️ DatabaseFixer Error (might be already fixed): " + e.getMessage());
        }
    }
}
