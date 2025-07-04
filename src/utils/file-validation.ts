/**
 * File validation utilities for secure file uploads
 */

// File type definitions
export interface FileValidationResult {
  valid: boolean;
  reason?: string;
  detectedType?: string;
}

export interface FileInfo {
  buffer: Buffer;
  originalFilename: string;
  mimetype: string;
  size: number;
}

// Allowed file types with their MIME types and magic numbers
const ALLOWED_FILE_TYPES = {
  // PDF files
  pdf: {
    extensions: [".pdf"],
    mimeTypes: ["application/pdf"],
    magicNumbers: [
      [0x25, 0x50, 0x44, 0x46], // %PDF
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  // DOCX files
  docx: {
    extensions: [".docx"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    magicNumbers: [
      [0x50, 0x4b, 0x03, 0x04], // ZIP signature (DOCX is a ZIP file)
      [0x50, 0x4b, 0x05, 0x06], // ZIP signature (empty archive)
      [0x50, 0x4b, 0x07, 0x08], // ZIP signature (spanned archive)
    ],
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  // XLSX files
  xlsx: {
    extensions: [".xlsx"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    magicNumbers: [
      [0x50, 0x4b, 0x03, 0x04], // ZIP signature
      [0x50, 0x4b, 0x05, 0x06], // ZIP signature (empty archive)
      [0x50, 0x4b, 0x07, 0x08], // ZIP signature (spanned archive)
    ],
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  // PPTX files
  pptx: {
    extensions: [".pptx"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    magicNumbers: [
      [0x50, 0x4b, 0x03, 0x04], // ZIP signature
      [0x50, 0x4b, 0x05, 0x06], // ZIP signature (empty archive)
      [0x50, 0x4b, 0x07, 0x08], // ZIP signature (spanned archive)
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  // JPEG files
  jpeg: {
    extensions: [".jpg", ".jpeg"],
    mimeTypes: ["image/jpeg"],
    magicNumbers: [
      [0xff, 0xd8, 0xff], // JPEG signature
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  // PNG files
  png: {
    extensions: [".png"],
    mimeTypes: ["image/png"],
    magicNumbers: [
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG signature
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  // GIF files (optional, can be removed if not needed)
  gif: {
    extensions: [".gif"],
    mimeTypes: ["image/gif"],
    magicNumbers: [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
    ],
    maxSize: 2 * 1024 * 1024, // 2MB
  },
};

// Dangerous file types that should never be allowed
const DANGEROUS_FILE_TYPES = [
  // Executable files
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".pif",
  ".scr",
  ".vbs",
  ".vbe",
  ".js",
  ".jse",
  ".ws",
  ".wsf",
  ".wsc",
  ".wsh",
  ".ps1",
  ".ps1xml",
  ".ps2",
  ".ps2xml",
  ".psc1",
  ".psc2",
  ".msh",
  ".msh1",
  ".msh2",
  ".mshxml",
  ".msh1xml",
  ".msh2xml",

  // Script files
  ".sh",
  ".bash",
  ".zsh",
  ".fish",
  ".csh",
  ".tcsh",
  ".ksh",
  ".py",
  ".rb",
  ".pl",
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
  ".cgi",

  // Web files that can execute
  ".html",
  ".htm",
  ".xhtml",
  ".xml",
  ".svg",
  ".swf",

  // Archive files that might contain executables
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".bz2",
  ".xz",

  // Other potentially dangerous formats
  ".jar",
  ".class",
  ".dex",
  ".apk",
  ".ipa",
  ".dmg",
  ".pkg",
  ".msi",
  ".deb",
  ".rpm",
];

/**
 * Check if a file extension is in the dangerous list
 */
function isDangerousFileType(filename: string): boolean {
  const extension = getFileExtension(filename);
  return DANGEROUS_FILE_TYPES.includes(extension);
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.substring(lastDot).toLowerCase();
}

/**
 * Check if magic numbers match
 */
function checkMagicNumbers(buffer: Buffer, magicNumbers: number[][]): boolean {
  for (const magic of magicNumbers) {
    if (buffer.length >= magic.length) {
      let matches = true;
      for (let i = 0; i < magic.length; i++) {
        if (buffer[i] !== magic[i]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
  }
  return false;
}

/**
 * Detect file type based on magic numbers
 */
function detectFileType(buffer: Buffer): string | null {
  for (const [type, config] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (checkMagicNumbers(buffer, config.magicNumbers)) {
      return type;
    }
  }
  return null;
}

/**
 * Validate file extension against allowed types
 */
function validateFileExtension(filename: string): FileValidationResult {
  const extension = getFileExtension(filename);

  if (!extension) {
    return {
      valid: false,
      reason: "File must have an extension",
    };
  }

  // Check if it's a dangerous file type
  if (isDangerousFileType(filename)) {
    return {
      valid: false,
      reason: `File type ${extension} is not allowed for security reasons`,
    };
  }

  // Check if it's in our allowed list
  const allowedType = Object.entries(ALLOWED_FILE_TYPES).find(([_, config]) =>
    config.extensions.includes(extension)
  );

  if (!allowedType) {
    return {
      valid: false,
      reason: `File type ${extension} is not allowed. Allowed types: ${Object.values(
        ALLOWED_FILE_TYPES
      )
        .flatMap((config) => config.extensions)
        .join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Validate MIME type
 */
function validateMimeType(
  mimetype: string,
  filename: string
): FileValidationResult {
  const extension = getFileExtension(filename);

  const allowedType = Object.entries(ALLOWED_FILE_TYPES).find(([_, config]) =>
    config.extensions.includes(extension)
  );

  if (!allowedType) {
    return {
      valid: false,
      reason: "File extension not allowed",
    };
  }

  const [typeName, config] = allowedType;

  if (!config.mimeTypes.includes(mimetype)) {
    return {
      valid: false,
      reason: `MIME type ${mimetype} does not match expected types for ${extension}: ${config.mimeTypes.join(
        ", "
      )}`,
    };
  }

  return { valid: true };
}

/**
 * Validate file size
 */
function validateFileSize(
  size: number,
  filename: string
): FileValidationResult {
  const extension = getFileExtension(filename);

  const allowedType = Object.entries(ALLOWED_FILE_TYPES).find(([_, config]) =>
    config.extensions.includes(extension)
  );

  if (!allowedType) {
    return {
      valid: false,
      reason: "File extension not allowed",
    };
  }

  const [typeName, config] = allowedType;

  if (size > config.maxSize) {
    const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
    const fileSizeMB = Math.round(size / (1024 * 1024));
    return {
      valid: false,
      reason: `File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB for ${extension} files`,
    };
  }

  return { valid: true };
}

/**
 * Validate file content using magic numbers
 */
function validateFileContent(
  buffer: Buffer,
  filename: string
): FileValidationResult {
  const extension = getFileExtension(filename);
  const detectedType = detectFileType(buffer);

  if (!detectedType) {
    return {
      valid: false,
      reason: "File content does not match any allowed file type",
    };
  }

  const allowedType = Object.entries(ALLOWED_FILE_TYPES).find(([_, config]) =>
    config.extensions.includes(extension)
  );

  if (!allowedType) {
    return {
      valid: false,
      reason: "File extension not allowed",
    };
  }

  const [expectedType] = allowedType;

  // For Office documents (DOCX, XLSX, PPTX), they all have ZIP signatures
  // so we need to be more lenient with the content validation
  if (
    ["docx", "xlsx", "pptx"].includes(expectedType) &&
    detectedType === "docx"
  ) {
    return { valid: true, detectedType };
  }

  if (detectedType !== expectedType) {
    return {
      valid: false,
      reason: `File content (${detectedType}) does not match file extension (${extension})`,
      detectedType,
    };
  }

  return { valid: true, detectedType };
}

/**
 * Scan file content for potentially dangerous patterns
 */
function scanForDangerousContent(buffer: Buffer): FileValidationResult {
  const content = buffer.toString("utf8", 0, Math.min(buffer.length, 1024)); // Check first 1KB

  // Patterns that might indicate malicious content
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /vbscript:/gi, // VBScript protocol
    /on\w+\s*=/gi, // Event handlers (onclick, onload, etc.)
    /eval\s*\(/gi, // eval() function
    /document\.write/gi, // document.write
    /window\.location/gi, // window.location
    /\.exe\b/gi, // Executable references
    /cmd\.exe/gi, // Command prompt
    /powershell/gi, // PowerShell
    /\/bin\/sh/gi, // Shell references
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      return {
        valid: false,
        reason: "File contains potentially dangerous content patterns",
      };
    }
  }

  return { valid: true };
}

/**
 * Main file validation function
 */
export function validateFile(fileInfo: FileInfo): FileValidationResult {
  const { buffer, originalFilename, mimetype, size } = fileInfo;

  // 1. Validate file extension
  const extensionResult = validateFileExtension(originalFilename);
  if (!extensionResult.valid) {
    return extensionResult;
  }

  // 2. Validate file size
  const sizeResult = validateFileSize(size, originalFilename);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  // 3. Validate MIME type
  const mimeResult = validateMimeType(mimetype, originalFilename);
  if (!mimeResult.valid) {
    return mimeResult;
  }

  // 4. Validate file content using magic numbers
  const contentResult = validateFileContent(buffer, originalFilename);
  if (!contentResult.valid) {
    return contentResult;
  }

  // 5. Scan for dangerous content patterns
  const dangerousContentResult = scanForDangerousContent(buffer);
  if (!dangerousContentResult.valid) {
    return dangerousContentResult;
  }

  return {
    valid: true,
    detectedType: contentResult.detectedType,
  };
}

/**
 * Get allowed file types for client-side validation
 */
export function getAllowedFileExtensions(): string[] {
  return Object.values(ALLOWED_FILE_TYPES).flatMap(
    (config) => config.extensions
  );
}

/**
 * Get allowed MIME types
 */
export function getAllowedMimeTypes(): string[] {
  return Object.values(ALLOWED_FILE_TYPES).flatMap(
    (config) => config.mimeTypes
  );
}

/**
 * Get maximum file size for a given extension
 */
export function getMaxFileSize(filename: string): number {
  const extension = getFileExtension(filename);
  const allowedType = Object.entries(ALLOWED_FILE_TYPES).find(([_, config]) =>
    config.extensions.includes(extension)
  );

  return allowedType ? allowedType[1].maxSize : 0;
}
