package ma.ensem.jee.platform.task;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, UUID> {

	@Query("""
			select t from Task t
			where t.projectId = :projectId
			order by
				case t.status
					when ma.ensem.jee.platform.task.TaskStatus.TODO then 0
					when ma.ensem.jee.platform.task.TaskStatus.IN_PROGRESS then 1
					when ma.ensem.jee.platform.task.TaskStatus.DONE then 2
				end,
				t.sortOrder asc,
				t.createdAt asc
			""")
	List<Task> findByProjectIdOrdered(@Param("projectId") UUID projectId);

	long countByProjectId(UUID projectId);

	long countByProjectIdAndStatus(UUID projectId, TaskStatus status);

	long countByStatusNot(TaskStatus status);

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
