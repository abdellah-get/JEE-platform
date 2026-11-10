package ma.ensem.jee.platform.attachment;

import java.util.Locale;

/**
 * Magic-byte content-type detection for the attachment allowlist.
 * Client-declared MIME is ignored when sniffing succeeds.
 */
final class ContentTypeSniffer {

	private ContentTypeSniffer() {
	}

	static String sniff(byte[] header, String fileName) {
		if (header == null || header.length == 0) {
			return "application/octet-stream";
		}
		if (startsWith(header, new byte[] {0x25, 0x50, 0x44, 0x46})) {
			return "application/pdf";
		}
		if (startsWith(header, new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A})) {
			return "image/png";
		}
		if (header.length >= 3
				&& (header[0] & 0xFF) == 0xFF
				&& (header[1] & 0xFF) == 0xD8
				&& (header[2] & 0xFF) == 0xFF) {
			return "image/jpeg";
		}
		if (isWebp(header)) {
			return "image/webp";
		}
		if (startsWith(header, new byte[] {(byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0})) {
			return oleType(fileName);
		}
		if (startsWith(header, new byte[] {0x50, 0x4B, 0x03, 0x04})
				|| startsWith(header, new byte[] {0x50, 0x4B, 0x05, 0x06})
				|| startsWith(header, new byte[] {0x50, 0x4B, 0x07, 0x08})) {
			return zipFamilyType(fileName);
		}
		// DOS/Windows PE executables
		if (header.length >= 2 && header[0] == 'M' && header[1] == 'Z') {
			return "application/octet-stream";
		}
		if (looksLikePlainText(header)) {
			return "text/plain";
		}
		return "application/octet-stream";
	}

	private static boolean isWebp(byte[] header) {
		return header.length >= 12
				&& header[0] == 'R'
				&& header[1] == 'I'
				&& header[2] == 'F'
				&& header[3] == 'F'
				&& header[8] == 'W'
				&& header[9] == 'E'
				&& header[10] == 'B'
				&& header[11] == 'P';
	}

	private static String oleType(String fileName) {
		String ext = extension(fileName);
		if ("xls".equals(ext)) {
			return "application/vnd.ms-excel";
		}
		return "application/msword";
	}

	private static String zipFamilyType(String fileName) {
		String ext = extension(fileName);
		return switch (ext) {
			case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
			case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
			case "zip" -> "application/zip";
			default -> "application/zip";
		};
	}

	private static boolean looksLikePlainText(byte[] header) {
		int limit = Math.min(header.length, 512);
		int printable = 0;
		for (int i = 0; i < limit; i++) {
			int b = header[i] & 0xFF;
			if (b == 0) {
				return false;
			}
			if (b == 9 || b == 10 || b == 13 || (b >= 32 && b < 127) || b >= 128) {
				printable++;
			}
		}
		return printable >= limit * 0.85;
	}

	private static String extension(String fileName) {
		if (fileName == null || fileName.isBlank()) {
			return "";
		}
		String name = fileName.replace('\\', '/');
		int slash = name.lastIndexOf('/');
		String base = slash >= 0 ? name.substring(slash + 1) : name;
		int dot = base.lastIndexOf('.');
		if (dot < 0 || dot == base.length() - 1) {
			return "";
		}
		return base.substring(dot + 1).toLowerCase(Locale.ROOT);
	}

	private static boolean startsWith(byte[] data, byte[] prefix) {
		if (data.length < prefix.length) {
			return false;
		}
		for (int i = 0; i < prefix.length; i++) {
			if (data[i] != prefix[i]) {
				return false;
			}
		}
		return true;
	}
}
