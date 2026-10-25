package ma.ensem.jee.platform.attachment;

import java.io.IOException;
import java.io.InputStream;

/**
 * Blob backend for project attachments. Default: local filesystem (free tier).
 * Can later be swapped for S3/R2 without changing the API layer.
 */
public interface AttachmentStorage {

	void store(String storageKey, InputStream data, long sizeBytes) throws IOException;

	InputStream open(String storageKey) throws IOException;

	void delete(String storageKey) throws IOException;
}
