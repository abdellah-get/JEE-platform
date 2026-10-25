package ma.ensem.jee.platform.attachment;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.attachments")
public class AttachmentProperties {

	/** Local directory for file blobs (free-tier default; swap for S3 later). */
	private String storagePath = "./data/attachments";

	/** Max upload size in bytes (default 5 MiB). */
	private long maxSizeBytes = 5L * 1024 * 1024;

	/** Comma-separated MIME allowlist. */
	private String allowedContentTypes =
			"application/pdf,image/png,image/jpeg,image/webp,text/plain,"
					+ "application/msword,"
					+ "application/vnd.openxmlformats-officedocument.wordprocessingml.document,"
					+ "application/vnd.ms-excel,"
					+ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,"
					+ "application/zip";

	public String getStoragePath() {
		return storagePath;
	}

	public void setStoragePath(String storagePath) {
		this.storagePath = storagePath;
	}

	public long getMaxSizeBytes() {
		return maxSizeBytes;
	}

	public void setMaxSizeBytes(long maxSizeBytes) {
		this.maxSizeBytes = maxSizeBytes;
	}

	public String getAllowedContentTypes() {
		return allowedContentTypes;
	}

	public void setAllowedContentTypes(String allowedContentTypes) {
		this.allowedContentTypes = allowedContentTypes;
	}

	public List<String> allowedContentTypeList() {
		return Arrays.stream(allowedContentTypes.split(","))
				.map(String::trim)
				.filter(s -> !s.isEmpty())
				.map(s -> s.toLowerCase(Locale.ROOT))
				.toList();
	}
}
