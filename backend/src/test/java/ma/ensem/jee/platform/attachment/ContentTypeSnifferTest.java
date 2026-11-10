package ma.ensem.jee.platform.attachment;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ContentTypeSnifferTest {

	@Test
	void detectsPdfPngJpegAndRejectsExeBytes() {
		assertThat(ContentTypeSniffer.sniff("%PDF-1.4".getBytes(), "doc.pdf"))
				.isEqualTo("application/pdf");
		assertThat(ContentTypeSniffer.sniff(
						new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}, "a.png"))
				.isEqualTo("image/png");
		assertThat(ContentTypeSniffer.sniff(new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0}, "a.jpg"))
				.isEqualTo("image/jpeg");
		assertThat(ContentTypeSniffer.sniff("MZ......".getBytes(), "hack.exe"))
				.isEqualTo("application/octet-stream");
	}

	@Test
	void zipExtensionMapsToOfficeOrZip() {
		byte[] zip = new byte[] {0x50, 0x4B, 0x03, 0x04, 0x00};
		assertThat(ContentTypeSniffer.sniff(zip, "notes.docx"))
				.isEqualTo("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
		assertThat(ContentTypeSniffer.sniff(zip, "archive.zip")).isEqualTo("application/zip");
	}
}
