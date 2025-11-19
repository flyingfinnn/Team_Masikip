package csit360.g6.team.masikip.repository;

import csit360.g6.team.masikip.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByIsActiveTrue();

}