package ma.ensem.jee.platform.task;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, UUID> {

	List<Task> findByProjectIdOrderBySortOrderAscCreatedAtAsc(UUID projectId);

	long countByProjectId(UUID projectId);

	long countByProjectIdAndStatus(UUID projectId, TaskStatus status);

	@Query("""
			select t from Task t
			where t.assigneeId = :userId
			  and (:status is null or t.status = :status)
			  and (:priority is null or t.priority = :priority)
			  and (:projectId is null or t.projectId = :projectId)
			order by t.dueDate asc nulls last, t.updatedAt desc
			""")
	List<Task> findAssignedTo(
			@Param("userId") UUID userId,
			@Param("status") TaskStatus status,
			@Param("priority") TaskPriority priority,
			@Param("projectId") UUID projectId);
}
