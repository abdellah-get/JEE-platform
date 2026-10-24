package ma.ensem.jee.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class JeePlatformApplication {

	public static void main(String[] args) {
		SpringApplication.run(JeePlatformApplication.class, args);
	}

}
