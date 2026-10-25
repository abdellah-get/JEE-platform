package ma.ensem.jee.platform.project;

import java.util.Optional;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.ResourceNotFoundException;
import ma.ensem.jee.platform.user.ClubRole;

@Service
public class ProjectAccessService {

	private final ProjectRepository projectRepository;
	private final ProjectMemberRepository projectMemberRepository;

	public ProjectAccessService(ProjectRepository projectRepository, ProjectMemberRepository projectMemberRepository) {
		this.projectRepository = projectRepository;
		this.projectMemberRepository = projectMemberRepository;
	}

	public boolean isClubStaff(UserPrincipal user) {
		return user.getClubRole() == ClubRole.BUREAU || user.getClubRole() == ClubRole.ADMIN_TECH;
	}

	public void requireCanCreate(UserPrincipal user) {
		if (!isClubStaff(user)) {
			throw new AccessDeniedException("Seul le bureau peut créer un projet");
		}
	}

	public Project requireVisibleProject(UUID projectId, UserPrincipal user) {
		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));

		if (isClubStaff(user) || projectMemberRepository.existsByProjectIdAndUserId(projectId, user.getId())) {
			return project;
		}

		// Pas de fuite d'existence pour un membre hors équipe
		throw new ResourceNotFoundException("Projet introuvable");
	}

	public Optional<ProjectRole> findRole(UUID projectId, UUID userId) {
		return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
				.map(ProjectMember::getProjectRole);
	}

	public void requireCanEdit(UUID projectId, UserPrincipal user) {
		requireVisibleProject(projectId, user);
		if (isClubStaff(user)) {
			return;
		}
		ProjectRole role = findRole(projectId, user.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
		if (role != ProjectRole.CHEF_PROJET) {
			throw new AccessDeniedException("Seul le chef de projet peut modifier ce projet");
		}
	}

	public void requireCanManageMembers(UUID projectId, UserPrincipal user) {
		requireVisibleProject(projectId, user);
		if (isClubStaff(user)) {
			return;
		}
		ProjectRole role = findRole(projectId, user.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
		if (role != ProjectRole.CHEF_PROJET) {
			throw new AccessDeniedException("Seul le chef de projet peut gérer l'équipe");
		}
	}

	/** Suppression de tâche : chef de projet ou bureau / admin tech. */
	public void requireCanDeleteTask(UUID projectId, UserPrincipal user) {
		requireVisibleProject(projectId, user);
		if (isClubStaff(user)) {
			return;
		}
		ProjectRole role = findRole(projectId, user.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
		if (role != ProjectRole.CHEF_PROJET) {
			throw new AccessDeniedException("Seul le chef de projet ou le bureau peut supprimer une tâche");
		}
	}
}
