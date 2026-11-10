package ma.ensem.jee.platform.attachment;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import jakarta.annotation.PreDestroy;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Component
@ConditionalOnProperty(prefix = "app.attachments", name = "backend", havingValue = "s3")
public class S3AttachmentStorage implements AttachmentStorage {

	private final S3Client client;
	private final String bucket;

	public S3AttachmentStorage(AttachmentProperties properties) {
		if (properties.getS3Bucket() == null || properties.getS3Bucket().isBlank()) {
			throw new IllegalStateException("app.attachments.s3-bucket est requis quand backend=s3");
		}
		if (properties.getS3AccessKey() == null || properties.getS3AccessKey().isBlank()
				|| properties.getS3SecretKey() == null || properties.getS3SecretKey().isBlank()) {
			throw new IllegalStateException("Identifiants S3/R2 manquants (access/secret key)");
		}

		this.bucket = properties.getS3Bucket().trim();
		var credentials = StaticCredentialsProvider.create(
				AwsBasicCredentials.create(properties.getS3AccessKey(), properties.getS3SecretKey()));

		var builder = S3Client.builder()
				.credentialsProvider(credentials)
				.region(Region.of(
						properties.getS3Region() == null || properties.getS3Region().isBlank()
								? "auto"
								: properties.getS3Region().trim()))
				.serviceConfiguration(S3Configuration.builder()
						.pathStyleAccessEnabled(true)
						.build());

		if (properties.getS3Endpoint() != null && !properties.getS3Endpoint().isBlank()) {
			builder.endpointOverride(URI.create(properties.getS3Endpoint().trim()));
		}

		this.client = builder.build();
	}

	@Override
	public void store(String storageKey, InputStream data, long sizeBytes) throws IOException {
		try {
			client.putObject(
					PutObjectRequest.builder().bucket(bucket).key(storageKey).build(),
					RequestBody.fromInputStream(data, sizeBytes));
		}
		catch (RuntimeException ex) {
			throw new IOException("Échec upload S3/R2: " + storageKey, ex);
		}
	}

	@Override
	public InputStream open(String storageKey) throws IOException {
		try {
			return client.getObject(GetObjectRequest.builder().bucket(bucket).key(storageKey).build());
		}
		catch (RuntimeException ex) {
			throw new IOException("Échec lecture S3/R2: " + storageKey, ex);
		}
	}

	@Override
	public void delete(String storageKey) throws IOException {
		try {
			client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(storageKey).build());
		}
		catch (RuntimeException ex) {
			throw new IOException("Échec suppression S3/R2: " + storageKey, ex);
		}
	}

	@PreDestroy
	void close() {
		client.close();
	}
}
