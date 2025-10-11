package com.trackcar.imageserver;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.core.io.InputStreamResource;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mongodb.client.gridfs.model.GridFSFile;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class GridFSController {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        MediaType.IMAGE_JPEG_VALUE,
        MediaType.IMAGE_PNG_VALUE,
        "image/webp"
    );

    private final GridFsTemplate gridFsTemplate;

    // Upload de imagem (exige multipart/form-data)
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(@RequestPart("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Arquivo vazio");
            }
            if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
                return ResponseEntity.badRequest().body("Tipo de arquivo não permitido");
            }

            String original = StringUtils.hasText(file.getOriginalFilename())
                              ? file.getOriginalFilename()
                              : UUID.randomUUID().toString();
            String filename = UUID.randomUUID() + "_" + original;

            gridFsTemplate.store(file.getInputStream(), filename, file.getContentType());

            return ResponseEntity.ok(Map.of(
                "filename", filename,
                "message", "Upload realizado com sucesso",
                "url", "/files/download/" + filename
            ));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Erro ao salvar o arquivo");
        }
    }

    // Download da imagem via filename
    @GetMapping("/download/{filename:.+}")
    public ResponseEntity<?> download(@PathVariable String filename) {
        try {
            GridFSFile file = gridFsTemplate.findOne(new Query(Criteria.where("filename").is(filename)));
            if (file == null) {
                return ResponseEntity.notFound().build();
            }

            GridFsResource resource = gridFsTemplate.getResource(file);
            InputStreamResource stream = new InputStreamResource(resource.getInputStream());

            String contentType = resource.getContentType();
            if (contentType == null) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + file.getFilename() + "\"")
                .body(stream);

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                                 .body("Erro ao ler o arquivo: " + e.getMessage());
        }
    }

    // Deletar arquivo
    @DeleteMapping("/delete/{filename:.+}")
    public ResponseEntity<?> deleteFile(@PathVariable String filename) {
        try {
            GridFSFile file = gridFsTemplate.findOne(new Query(Criteria.where("filename").is(filename)));
            if (file == null) {
                return ResponseEntity.notFound().build();
            }
            gridFsTemplate.delete(new Query(Criteria.where("filename").is(filename)));
            return ResponseEntity.ok(Map.of(
                "filename", filename,
                "message", "Arquivo deletado com sucesso"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                                 .body("Erro ao deletar arquivo: " + e.getMessage());
        }
    }
}
