package ma.ensem.jee.platform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

	@Bean
	OpenAPI jeePlatformOpenApi() {
		final String bearer = "bearerAuth";
		return new OpenAPI()
				.info(new Info()
						.title("JEE Platform API")
						.description("API Junior Entreprise ENSEM — projets, tâches, annonces, événements.")
						.version("v1")
						.contact(new Contact().name("Bureau JEE").email("bureau@ensem.jee")))
				.addSecurityItem(new SecurityRequirement().addList(bearer))
				.components(new Components().addSecuritySchemes(bearer,
						new SecurityScheme()
								.name(bearer)
								.type(SecurityScheme.Type.HTTP)
								.scheme("bearer")
								.bearerFormat("JWT")));
	}
}
