# Project Files Setup Guide

This guide will help you set up the secure document upload feature for your TropiTrack application.

## Database Migration

You need to run the SQL migration to create the necessary database tables and storage bucket. Here's how:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/migrations/20240333000000_create_project_files.sql`
4. Click "Run" to execute the migration

### Option 2: Using Supabase CLI

If you have Supabase CLI configured:

```bash
npx supabase db push
```

## What the Migration Creates

The migration will create:

1. **`project_files` table** - Stores file metadata
2. **`project_documents` storage bucket** - Stores actual files
3. **Row Level Security (RLS) policies** - Ensures secure access
4. **Indexes** - For better query performance

## Features Included

### ✅ Secure File Upload
- Drag & drop interface
- File type validation (PDF, PNG, JPG, DOCX, XLSX, PPTX)
- File size limits (50MB max)
- Progress tracking
- Error handling

### ✅ Access Control
- Only admins and managers can upload files
- Only project members can view files
- Only uploaders or admins can delete files
- Secure signed URLs for downloads

### ✅ File Management
- Search and filter by category
- File preview with metadata
- Secure download with 1-hour expiry
- Delete functionality with confirmation

### ✅ Categories
- Contract
- Permit
- Plan
- Invoice
- Receipt
- Specification
- Safety
- Quality
- Other

## Security Features

- **Encrypted Storage**: Files are stored securely in Supabase Storage
- **Signed URLs**: Downloads use temporary signed URLs (1-hour expiry)
- **Row Level Security**: Database-level access control
- **File Type Validation**: Only allowed file types can be uploaded
- **Size Limits**: Prevents abuse with file size restrictions

## Usage

Once the migration is complete:

1. Navigate to any project in your dashboard
2. Click on the "Documents" tab
3. If you have admin/manager permissions, you'll see the upload interface
4. Drag & drop files or click to browse
5. Add metadata (name, description, category)
6. Upload and manage your project documents

## Troubleshooting

### Migration Errors
- Ensure you have the necessary permissions in your Supabase project
- Check that the storage bucket doesn't already exist
- Verify that RLS is enabled on the `project_files` table

### Upload Issues
- Check file type and size restrictions
- Ensure you have proper permissions (admin/manager role)
- Verify your Supabase storage configuration

### Download Issues
- Check that the file exists in storage
- Verify RLS policies are working correctly
- Ensure the signed URL hasn't expired

## File Structure

```
components/projects/
├── project-document-upload.tsx    # Upload component with drag & drop
├── project-files-list.tsx         # File list with search/filter
└── project-documents-new.tsx      # Main component combining upload + list

lib/
├── types/project-file.ts          # TypeScript types
└── data/project-files.ts          # Data access functions

supabase/migrations/
└── 20240333000000_create_project_files.sql  # Database migration
```

## Next Steps

After setup, you can:

1. Test the upload functionality with different file types
2. Verify access control works correctly
3. Test the download functionality
4. Customize categories or add new features as needed

The feature is now ready to use! 🎉 