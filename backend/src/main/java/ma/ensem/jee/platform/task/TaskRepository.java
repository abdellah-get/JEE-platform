package ma.ensem.jee.platform.task;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
			select count(t) from Task t
			where t.status <> ma.ensem.jee.platform.task.TaskStatus.DONE
			  and t.dueDate is not null
			  and t.dueDate < :today
			""")
	long countOverdue(@Param("today") LocalDate today);

	@Query("""
			select count(t) from Task t
			where t.projectId = :projectId
			  and t.status <> ma.ensem.jee.platform.task.TaskStatus.DONE
			""")
	long countOpenByProjectId(@Param("projectId") UUID projectId);

	@Query("""
			select count(t) from Task t
			where t.projectId = :projectId
			  and t.status <> ma.ensem.jee.platform.task.TaskStatus.DONE
			  and t.dueDate is not null
			  and t.dueDate < :today
			""")
	long countOverdueByProjectId(@Param("projectId") UUID projectId, @Param("today") LocalDate today);

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

	@Query("""
			select t from Task t
			where t.assigneeId = :userId
			  and (:status is null or t.status = :status)
			  and (:priority is null or t.priority = :priority)
			  and (:projectId is null or t.projectId = :projectId)
			order by t.dueDate asc nulls last, t.updatedAt desc
			""")
	Page<Task> findAssignedTo(
			@Param("userId") UUID userId,
			@Param("status") TaskStatus status,
			@Param("priority") TaskPriority priority,
			@Param("projectId") UUID projectId,
			Pageable pageable);

	@Query("""
			select t from Task t
			where t.assigneeId = :userId
			  and (:status is null or t.status = :status)
			  and (:priority is null or t.priority = :priority)
			  and (:projectId is null or t.projectId = :projectId)
			  and t.projectId in (
			    select m.projectId from ProjectMember m where m.userId = :userId
			  )
			order by t.dueDate asc nulls last, t.updatedAt desc
			""")
	Page<Task> findAssignedToVisibleProjects(
			@Param("userId") UUID userId,
			@Param("status") TaskStatus status,
			@Param("priority") TaskPriority priority,
			@Param("projectId") UUID projectId,
			Pageable pageable);

	@Query("""
			select t from Task t
			where t.dueDate is not null
			  and t.dueDate >= :from
			  and t.dueDate <= :to
			  and t.status <> ma.ensem.jee.platform.task.TaskStatus.DONE
			order by t.dueDate asc
			""")
	List<Task> findDueBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

	@Query("""
			select t from Task t
			where lower(t.title) like lower(concat('%', :q, '%'))
			   or (t.description is not null and lower(t.description) like lower(concat('%', :q, '%')))
			order by t.updatedAt desc
			""")
	Page<Task> searchByText(@Param("q") String q, Pageable pageable);
}
