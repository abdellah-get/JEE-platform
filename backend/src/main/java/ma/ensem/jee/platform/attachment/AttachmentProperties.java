package ma.ensem.jee.platform.attachment;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.attachments")
public class AttachmentProperties {

	/** local (default) or s3 (S3-compatible / Cloudflare R2). */
	private String backend = "local";

	/** Local directory for file blobs when backend=local. */
	private String storagePath = "./data/attachments";

	/** Max upload size in bytes (default 5 MiB). */
	private long maxSizeBytes = 5L * 1024 * 1024;

	/** Comma-separated MIME allowlist (validated after magic-byte sniff). */
	private String allowedContentTypes =
			"application/pdf,image/png,image/jpeg,image/webp,text/plain,"
					+ "application/msword,"
					+ "application/vnd.openxmlformats-officedocument.wordprocessingml.document,"
					+ "application/vnd.ms-excel,"
					+ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,"
					+ "application/zip";

	private String s3Endpoint = "";
	private String s3Region = "auto";
	private String s3Bucket = "";
	private String s3AccessKey = "";
	private String s3SecretKey = "";

	public String getBackend() {
		return backend;
	}

	public void setBackend(String backend) {
		this.backend = backend;
	}

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

	public String getS3Endpoint() {
		return s3Endpoint;
	}

	public void setS3Endpoint(String s3Endpoint) {
		this.s3Endpoint = s3Endpoint;
	}

	public String getS3Region() {
		return s3Region;
	}

	public void setS3Region(String s3Region) {
		this.s3Region = s3Region;
	}

	public String getS3Bucket() {
		return s3Bucket;
	}

	public void setS3Bucket(String s3Bucket) {
		this.s3Bucket = s3Bucket;
	}

	public String getS3AccessKey() {
		return s3AccessKey;
	}

	public void setS3AccessKey(String s3AccessKey) {
		this.s3AccessKey = s3AccessKey;
	}

	public String getS3SecretKey() {
		return s3SecretKey;
	}

	public void setS3SecretKey(String s3SecretKey) {
		this.s3SecretKey = s3SecretKey;
	}

	public List<String> allowedContentTypeList() {
		return Arrays.stream(allowedContentTypes.split(","))
				.map(String::trim)
				.filter(s -> !s.isEmpty())
				.map(s -> s.toLowerCase(Locale.ROOT))
				.toList();
	}
}
