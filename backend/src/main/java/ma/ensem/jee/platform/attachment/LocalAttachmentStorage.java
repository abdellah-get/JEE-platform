package ma.ensem.jee.platform.attachment;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

import org.springframework.stereotype.Component;

@Component
public class LocalAttachmentStorage implements AttachmentStorage {

	private final Path root;

	public LocalAttachmentStorage(AttachmentProperties properties) {
		this.root = Path.of(properties.getStoragePath()).toAbsolutePath().normalize();
		try {
			Files.createDirectories(this.root);
		}
		catch (IOException ex) {
			throw new UncheckedIOException("Impossible de créer le dossier pièces jointes: " + root, ex);
		}
	}

	@Override
	public void store(String storageKey, InputStream data, long sizeBytes) throws IOException {
		Path target = resolve(storageKey);
		Files.createDirectories(target.getParent());
		Files.copy(data, target, StandardCopyOption.REPLACE_EXISTING);
	}

	@Override
	public InputStream open(String storageKey) throws IOException {
		return Files.newInputStream(resolve(storageKey));
	}

	@Override
	public void delete(String storageKey) throws IOException {
		Files.deleteIfExists(resolve(storageKey));
	}

	private Path resolve(String storageKey) {
		Path resolved = root.resolve(storageKey).normalize();
		if (!resolved.startsWith(root)) {
			throw new IllegalArgumentException("Clé de stockage invalide");
		}
		return resolved;
	}
}
