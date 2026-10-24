package ma.ensem.jee.platform.seed;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.seed")
public record DemoDataProperties(boolean enabled) {
}
