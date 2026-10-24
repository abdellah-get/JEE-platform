package ma.ensem.jee.platform.user;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import ma.ensem.jee.platform.user.dto.AdminUserResponse;
import ma.ensem.jee.platform.user.dto.UpdateClubRoleRequest;
import ma.ensem.jee.platform.user.dto.UpdateUserActiveRequest;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

	private final AdminUserService adminUserService;

	public AdminUserController(AdminUserService adminUserService) {
		this.adminUserService = adminUserService;
	}

	@GetMapping
	public List<AdminUserResponse> list() {
		return adminUserService.listAll();
	}

	@PatchMapping("/{userId}/active")
	public AdminUserResponse updateActive(
			@PathVariable UUID userId,
			@Valid @RequestBody UpdateUserActiveRequest request) {
		return adminUserService.updateActive(userId, request);
	}

	@PatchMapping("/{userId}/role")
	public AdminUserResponse updateRole(
			@PathVariable UUID userId,
			@Valid @RequestBody UpdateClubRoleRequest request) {
		return adminUserService.updateRole(userId, request);
	}
}
