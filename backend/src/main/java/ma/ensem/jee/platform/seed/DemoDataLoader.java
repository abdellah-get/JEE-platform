package ma.ensem.jee.platform.seed;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.announcement.Announcement;
import ma.ensem.jee.platform.announcement.AnnouncementRepository;
import ma.ensem.jee.platform.project.Project;
import ma.ensem.jee.platform.project.ProjectMember;
import ma.ensem.jee.platform.project.ProjectMemberRepository;
import ma.ensem.jee.platform.project.ProjectRepository;
import ma.ensem.jee.platform.project.ProjectRole;
import ma.ensem.jee.platform.project.ProjectStatus;
import ma.ensem.jee.platform.task.Task;
import ma.ensem.jee.platform.task.TaskPriority;
import ma.ensem.jee.platform.task.TaskRepository;
import ma.ensem.jee.platform.task.TaskStatus;
import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Component
@EnableConfigurationProperties(DemoDataProperties.class)
public class DemoDataLoader implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DemoDataLoader.class);
	private static final String DEMO_PASSWORD = "Demo123!";

	private final DemoDataProperties properties;
	private final UserRepository userRepository;
	private final ProjectRepository projectRepository;
	private final ProjectMemberRepository projectMemberRepository;
	private final TaskRepository taskRepository;
	private final AnnouncementRepository announcementRepository;
	private final PasswordEncoder passwordEncoder;

	public DemoDataLoader(
			DemoDataProperties properties,
			UserRepository userRepository,
			ProjectRepository projectRepository,
			ProjectMemberRepository projectMemberRepository,
			TaskRepository taskRepository,
			AnnouncementRepository announcementRepository,
			PasswordEncoder passwordEncoder) {
		this.properties = properties;
		this.userRepository = userRepository;
		this.projectRepository = projectRepository;
		this.projectMemberRepository = projectMemberRepository;
		this.taskRepository = taskRepository;
		this.announcementRepository = announcementRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (!properties.enabled()) {
			return;
		}
		if (userRepository.existsByEmailIgnoreCase("bureau@ensem.jee")) {
			log.info("Seed demo déjà présent — ignoré");
			return;
		}

		log.info("Chargement des données demo (app.seed.enabled=true)");
		String hash = passwordEncoder.encode(DEMO_PASSWORD);

		User admin = userRepository.save(new User(
				"admin@ensem.jee", hash, "Ada", "Tech", ClubRole.ADMIN_TECH));
		User bureau = userRepository.save(new User(
				"bureau@ensem.jee", hash, "Bilal", "Bureau", ClubRole.BUREAU));
		User chef = userRepository.save(new User(
				"chef@ensem.jee", hash, "Chaimae", "Chef", ClubRole.MEMBRE));
		User membre = userRepository.save(new User(
				"membre@ensem.jee", hash, "Mehdi", "Membre", ClubRole.MEMBRE));

		Project site = projectRepository.save(new Project(
				"Site Junior ENSEM",
				"Refonte du site vitrine et espace membres.",
				ProjectStatus.ACTIF,
				bureau.getId()));
		projectMemberRepository.save(new ProjectMember(site.getId(), chef.getId(), ProjectRole.CHEF_PROJET));
		projectMemberRepository.save(new ProjectMember(site.getId(), membre.getId(), ProjectRole.CONTRIBUTEUR));
		projectMemberRepository.save(new ProjectMember(site.getId(), bureau.getId(), ProjectRole.CONTRIBUTEUR));

		taskRepository.save(new Task(
				site.getId(),
				"Maquette homepage",
				"Valider la maquette Figma avec le bureau.",
				TaskStatus.DONE,
				TaskPriority.HIGH,
				chef.getId(),
				LocalDate.now().minusDays(2),
				0,
				chef.getId()));
		taskRepository.save(new Task(
				site.getId(),
				"API auth JWT",
				null,
				TaskStatus.IN_PROGRESS,
				TaskPriority.HIGH,
				membre.getId(),
				LocalDate.now().plusDays(5),
				1,
				chef.getId()));
		taskRepository.save(new Task(
				site.getId(),
				"Déploiement Vercel",
				null,
				TaskStatus.TODO,
				TaskPriority.MEDIUM,
				null,
				LocalDate.now().plusDays(14),
				2,
				chef.getId()));

		long total = taskRepository.countByProjectId(site.getId());
		long done = taskRepository.countByProjectIdAndStatus(site.getId(), TaskStatus.DONE);
		site.setProgressPercent((int) Math.round((done * 100.0) / total));

		Project mobile = projectRepository.save(new Project(
				"App mobile JE",
				"Prototype mobile pour le suivi des missions.",
				ProjectStatus.BROUILLON,
				bureau.getId()));
		projectMemberRepository.save(new ProjectMember(mobile.getId(), chef.getId(), ProjectRole.CHEF_PROJET));

		announcementRepository.save(new Announcement(
				"AG extraordinaire vendredi",
				"Réunion de bureau à 18h en salle B12. Présence obligatoire des responsables projets.",
				true,
				bureau.getId()));
		announcementRepository.save(new Announcement(
				"Bienvenue sur JEE Platform",
				"Utilisez l'espace Projets pour suivre l'avancement et Mes tâches pour vos assignations.",
				false,
				admin.getId()));

		log.info(
				"Seed demo OK — comptes: admin/bureau/chef/membre@ensem.jee — mot de passe: {}",
				DEMO_PASSWORD);
	}
}
