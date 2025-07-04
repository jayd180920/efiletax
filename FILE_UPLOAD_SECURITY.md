# File Upload Security Implementation

This document outlines the comprehensive security measures implemented for file uploads and downloads in the efiletax-admin application.

## Security Issues Addressed

The following security vulnerabilities have been resolved:

1. **Lack of server-side file type validation**
2. **Missing MIME type and content-based validation**
3. **Insecure file serving without proper headers**
4. **Potential for malicious file uploads**
5. **Missing authentication controls for file access**

## Implemented Security Measures

### 1. Strict File Type Validation (`src/utils/file-validation.ts`)

#### Allowed File Types

- **PDF files**: `.pdf` (max 10MB)
- **Microsoft Office**: `.docx`, `.xlsx`, `.pptx` (max 25-50MB)
- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif` (max 2-5MB)

#### Blocked Dangerous File Types

- **Executable files**: `.exe`, `.bat`, `.cmd`, `.com`, `.pif`, `.scr`
- **Script files**: `.js`, `.html`, `.php`, `.py`, `.rb`, `.pl`, `.sh`
- **Web files**: `.svg`, `.swf`, `.xml`
- **Archive files**: `.zip`, `.rar`, `.7z`, `.tar`
- **Other dangerous formats**: `.jar`, `.class`, `.apk`, `.dmg`, `.msi`

#### Validation Layers

1. **File Extension Validation**: Checks against whitelist/blacklist
2. **MIME Type Validation**: Ensures MIME type matches file extension
3. **Magic Number Validation**: Verifies file content using binary signatures
4. **File Size Validation**: Enforces size limits per file type
5. **Content Scanning**: Detects dangerous patterns in file content

### 2. Enhanced Upload API (`src/app/api/upload/route.ts`)

#### Security Features

- **Authentication Required**: Both NextAuth.js and custom authentication supported
- **File Validation**: All files validated before S3 upload
- **Detailed Logging**: Comprehensive logging for security monitoring
- **Error Handling**: Secure error messages without information disclosure

#### Validation Process

```typescript
// File validation before upload
const fileInfo: FileInfo = {
  buffer: file.buffer,
  originalFilename: file.originalFilename,
  mimetype: file.mimetype,
  size: file.buffer.length,
};

const validationResult = validateFile(fileInfo);
if (!validationResult.valid) {
  return NextResponse.json(
    {
      error: "File validation failed",
      details: validationResult.reason,
    },
    { status: 400 }
  );
}
```

### 3. Secure File Storage (`src/lib/s3.ts`)

#### S3 Security Headers

- **Content-Type**: Forced to `application/octet-stream`
- **Content-Disposition**: Forced to `attachment; filename="..."`
- **Cache-Control**: `private, no-cache, no-store, must-revalidate`
- **No Public ACL**: Prevents public access to files

#### Metadata Storage

- Original filename and content type stored in metadata
- User ID and service ID for access control
- Upload timestamp for auditing

### 4. Secure File Serving

#### Proxy Endpoint (`src/app/api/s3/proxy/route.ts`)

- **Authentication Required**: User must be authenticated
- **Access Control**: Users can only access their own files
- **Secure Headers**: Forces download with security headers
- **Content Streaming**: Streams files through server for control

#### Security Headers Applied

```typescript
headers.set("Content-Type", "application/octet-stream");
headers.set(
  "Content-Disposition",
  `attachment; filename="${originalFilename}"`
);
headers.set("X-Content-Type-Options", "nosniff");
headers.set("X-Frame-Options", "DENY");
headers.set("X-XSS-Protection", "1; mode=block");
headers.set("Referrer-Policy", "no-referrer");
headers.set("Content-Security-Policy", "default-src 'none'");
headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
```

#### Enhanced Download API (`src/app/api/s3/download/route.ts`)

- **User-based Access Control**: Validates file ownership
- **Short-lived URLs**: 5-minute expiry for pre-signed URLs
- **Proxy Recommendation**: Recommends using secure proxy endpoint

### 5. Client-Side Security (`src/lib/s3-client.ts`)

#### New Functions

- `getSecureDownloadUrl()`: Returns secure proxy URL
- Enhanced `getSignedDownloadUrl()`: Supports filename parameter

#### File Upload Component (`src/components/registration/FileUploadField.tsx`)

- **Dynamic File Types**: Uses validation utility for allowed types
- **Secure Downloads**: Integrates with secure download functions
- **Enhanced Error Handling**: Better user feedback for validation errors

## File Access Control

### Path Structure

Files are organized with user-based access control:

```
uploads/{userId}/{serviceId}/{uniqueFileName}
```

### Access Validation

1. **Authentication**: User must be logged in
2. **Ownership**: User can only access files they uploaded
3. **Path Validation**: File path must follow expected structure
4. **Key Validation**: S3 key must be valid and accessible

## Security Monitoring

### Logging

- All file operations are logged with user context
- Validation failures are logged with reasons
- Security events are tracked for monitoring

### Error Handling

- Secure error messages that don't leak information
- Detailed logging for administrators
- Graceful degradation for security failures

## S3 Bucket Configuration

### Required S3 Settings

1. **Remove Public Access**: Disable all public read permissions
2. **CORS Configuration**: Restrict to application domain
3. **Bucket Policy**: Enforce authenticated access only

### Recommended Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalServiceName": "your-application-service"
        }
      }
    }
  ]
}
```

## Usage Examples

### Uploading Files

```typescript
// Files are automatically validated before upload
const result = await uploadFileToS3(file, serviceId, fieldName);
if (result.success) {
  console.log("File uploaded securely:", result.key);
}
```

### Downloading Files

```typescript
// Secure proxy download (recommended)
const secureUrl = await getSecureDownloadUrl(fileKey, filename);
window.open(secureUrl, "_blank");

// Or pre-signed URL (5-minute expiry)
const signedUrl = await getSignedDownloadUrl(fileKey, filename);
```

### File Validation

```typescript
import {
  validateFile,
  getAllowedFileExtensions,
} from "@/utils/file-validation";

// Get allowed file types for UI
const allowedTypes = getAllowedFileExtensions(); // ['.pdf', '.docx', '.jpg', ...]

// Validate a file
const result = validateFile({
  buffer: fileBuffer,
  originalFilename: "document.pdf",
  mimetype: "application/pdf",
  size: fileBuffer.length,
});

if (!result.valid) {
  console.error("Validation failed:", result.reason);
}
```

## Security Best Practices

### For Developers

1. **Always validate files server-side** - Never trust client-side validation
2. **Use the proxy endpoint** for file downloads when possible
3. **Monitor file upload logs** for suspicious activity
4. **Keep validation rules updated** as new threats emerge

### For Administrators

1. **Regularly review S3 bucket permissions**
2. **Monitor file upload patterns** for anomalies
3. **Keep security headers updated**
4. **Review and rotate S3 access keys**

### For Users

1. **Only upload necessary files**
2. **Verify file sources** before uploading
3. **Report suspicious file behavior**

## Testing Security

### File Type Tests

```bash
# Test dangerous file upload (should fail)
curl -X POST http://localhost:3000/api/upload \
  -F "serviceId=test" \
  -F "testFile=@malicious.exe"

# Test valid file upload (should succeed)
curl -X POST http://localhost:3000/api/upload \
  -F "serviceId=test" \
  -F "testFile=@document.pdf"
```

### Access Control Tests

```bash
# Test unauthorized file access (should fail)
curl http://localhost:3000/api/s3/proxy?key=uploads/other-user/service/file.pdf

# Test authorized file access (should succeed)
curl -H "Authorization: Bearer valid-token" \
  http://localhost:3000/api/s3/proxy?key=uploads/current-user/service/file.pdf
```

## Compliance

This implementation addresses common security frameworks:

- **OWASP Top 10**: Addresses injection, broken access control, and security misconfiguration
- **NIST Cybersecurity Framework**: Implements identify, protect, and detect functions
- **ISO 27001**: Supports information security management requirements

## Future Enhancements

1. **Virus Scanning**: Integrate with antivirus services
2. **Advanced Content Analysis**: ML-based content validation
3. **Audit Logging**: Enhanced logging for compliance
4. **Rate Limiting**: File upload rate limiting per user
5. **Encryption**: Client-side encryption before upload

## Troubleshooting

### Common Issues

1. **File validation fails**: Check file type and size limits
2. **Download fails**: Verify user authentication and file ownership
3. **S3 errors**: Check AWS credentials and bucket permissions

### Debug Commands

```bash
# Check file validation
node -e "
const { validateFile } = require('./src/utils/file-validation');
console.log(validateFile({
  buffer: Buffer.from('test'),
  originalFilename: 'test.pdf',
  mimetype: 'application/pdf',
  size: 4
}));
"

# Test S3 connection
aws s3 ls s3://your-bucket-name/uploads/ --profile your-profile
```

## Conclusion

This comprehensive security implementation provides multiple layers of protection against file upload vulnerabilities while maintaining usability. Regular monitoring and updates are essential to maintain security effectiveness.
