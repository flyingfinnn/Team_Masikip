package csit360.g6.team.masikip.repository;

import csit360.g6.team.masikip.model.NoteTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteTransactionRepository extends JpaRepository<NoteTransaction, Long> {

    List<NoteTransaction> findByNoteIdOrderByTimestampAsc(Long noteId);
}