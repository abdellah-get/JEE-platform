package ma.ensem.jee.platform.project;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.ResourceNotFoundException;
import ma.ensem.jee.platform.project.dto.CreateProjectRequest;
import ma.ensem.jee.platform.project.dto.ProjectMemberRequest;
import ma.ensem.jee.platform.project.dto.ProjectMemberResponse;
import ma.ensem.jee.platform.project.dto.ProjectResponse;
import ma.ensem.jee.platform.project.dto.ReplaceMembersRequest;
import ma.ensem.jee.platform.project.dto.UpdateProjectRequest;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class ProjectService {

	private final ProjectRepository projectRepository;
	private final ProjectMemberRepository projectMemberRepository;
	private final ProjectAccessService accessService;
	private final UserRepository userRepository;

	public ProjectService(
			ProjectRepository projectRepository,
			ProjectMemberRepository projectMemberRepository,
			ProjectAccessService accessService,
			UserRepository userRepository) {
		this.projectRepository = projectRepository;
		this.projectMemberRepository = projectMemberRepository;
		this.accessService = accessService;
		this.userRepository = userRepository;
	}

	@Transactional
	public ProjectResponse create(CreateProjectRequest request) {
		UserPrincipal current = SecurityUtils.currentUser();
		accessService.requireCanCreate(current);

		ProjectStatus status = request.status() != null ? request.status() : ProjectStatus.BROUILLON;
		Project project = new Project(
				request.name().trim(),
				normalizeDescription(request.description()),
				status,
				current.getId());
		projectRepository.save(project);

		if (request.chefUserId() != null) {
			User chef = userRepository.findById(request.chefUserId())
					.orElseThrow(() -> new ResourceNotFoundException("Chef de projet introuvable"));
			if (!chef.isActive()) {
				throw new IllegalArgumentException("Le chef désigné est inactif");
			}
			projectMemberRepository.save(new ProjectMember(project.getId(), chef.getId(), ProjectRole.CHEF_PROJET));
		}

		ProjectRole myRole = accessService.findRole(project.getId(), current.getId()).orElse(null);
		return ProjectResponse.from(project, myRole);
	}

	@Transactional(readOnly = true)
	public List<ProjectResponse> list() {
		UserPrincipal current = SecurityUtils.currentUser();
		List<Project> projects = accessService.isClubStaff(current)
				? projectRepository.findAllByOrderByUpdatedAtDesc()
				: projectRepository.findAllVisibleToMember(current.getId());

		return projects.stream()
				.map(p -> ProjectResponse.from(p, accessService.findRole(p.getId(), current.getId()).orElse(null)))
				.toList();
	}

	@Transactional(readOnly = true)
	public ProjectResponse get(UUID projectId) {
		UserPrincipal current = SecurityUtils.currentUser();
		Project project = accessService.requireVisibleProject(projectId, current);
		return ProjectResponse.from(project, accessService.findRole(projectId, current.getId()).orElse(null));
	}

	@Transactional
	public ProjectResponse update(UUID projectId, UpdateProjectRequest request) {
		UserPrincipal current = SecurityUtils.currentUser();
		accessService.requireCanEdit(projectId, current);
		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));

		if (request.name() != null && !request.name().isBlank()) {
			project.setName(request.name().trim());
		}
		if (request.description() != null) {
			project.setDescription(normalizeDescription(request.description()));
		}
		if (request.status() != null) {
			project.setStatus(request.status());
		}

		return ProjectResponse.from(project, accessService.findRole(projectId, current.getId()).orElse(null));
	}

	@Transactional(readOnly = true)
	public List<ProjectMemberResponse> listMembers(UUID projectId) {
		UserPrincipal current = SecurityUtils.currentUser();
		accessService.requireVisibleProject(projectId, current);
		return toMemberResponses(projectMemberRepository.findByProjectIdOrderByJoinedAtAsc(projectId));
	}

	@Transactional
	public List<ProjectMemberResponse> replaceMembers(UUID projectId, ReplaceMembersRequest request) {
		UserPrincipal current = SecurityUtils.currentUser();
		accessService.requireCanManageMembers(projectId, current);
		accessService.requireVisibleProject(projectId, current);

		List<ProjectMemberRequest> members = request.members() != null ? request.members() : List.of();
		validateMembers(members);

		projectMemberRepository.deleteByProjectId(projectId);
		projectMemberRepository.flush();

		List<ProjectMember> saved = new ArrayList<>();
		for (ProjectMemberRequest member : members) {
			saved.add(projectMemberRepository.save(
					new ProjectMember(projectId, member.userId(), member.role())));
		}
		return toMemberResponses(saved);
	}

	private void validateMembers(List<ProjectMemberRequest> members) {
		Set<UUID> seen = new HashSet<>();
		long chefCount = 0;
		for (ProjectMemberRequest member : members) {
			if (!seen.add(member.userId())) {
				throw new IllegalArgumentException("Membre en double dans l'équipe");
			}
			User user = userRepository.findById(member.userId())
					.orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
			if (!user.isActive()) {
				throw new IllegalArgumentException("Impossible d'ajouter un membre inactif");
			}
			if (member.role() == ProjectRole.CHEF_PROJET) {
				chefCount++;
			}
		}
		if (!members.isEmpty() && chefCount < 1) {
			throw new IllegalArgumentException("L'équipe doit avoir au moins un chef de projet");
		}
		if (chefCount > 1) {
			throw new IllegalArgumentException("Un seul chef de projet est autorisé");
		}
	}

	private List<ProjectMemberResponse> toMemberResponses(List<ProjectMember> members) {
		if (members.isEmpty()) {
			return List.of();
		}
		Set<UUID> userIds = members.stream().map(ProjectMember::getUserId).collect(Collectors.toSet());
		Map<UUID, User> users = userRepository.findAllById(userIds).stream()
				.collect(Collectors.toMap(User::getId, Function.identity()));

		return members.stream()
				.map(m -> {
					User user = users.get(m.getUserId());
					if (user == null) {
						throw new ResourceNotFoundException("Utilisateur introuvable");
					}
					return ProjectMemberResponse.from(m, user);
				})
				.toList();
	}

	private static String normalizeDescription(String description) {
		if (description == null || description.isBlank()) {
			return null;
		}
		return description.trim();
	}
}
