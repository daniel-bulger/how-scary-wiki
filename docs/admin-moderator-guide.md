# Admin and Moderator Guide

## Overview

The How Scary Wiki has a role-based access control system with three user roles:

1. **USER** - Regular users who can rate and review entities
2. **MODERATOR** - Content moderators who can edit wiki entries
3. **ADMIN** - Administrators who can manage users and have all moderator permissions

## Setting Up the First Admin

After deploying the application and running database migrations, you'll need to create the first admin user:

1. First, sign up for an account through the regular sign-in flow
2. Run the following command with your email:

```bash
npm run make-admin your-email@example.com
```

## Admin Features

### Admin Dashboard

Admins can access the admin dashboard at `/admin` where they can:

- View all users
- Search users by email or name
- Filter users by role
- Change user roles (promote to moderator/admin or demote)
- View user activity (ratings, reviews, moderation actions)

### Accessing Admin Dashboard

1. Sign in with an admin account
2. Click the "Admin" link in the header (desktop) or mobile menu

## Moderator Features

Moderators and admins have access to moderation tools on every wiki page.

### Moderator Tools Panel

Click the "Moderator Tools" button in the bottom-right corner of any wiki page to access:

1. **Edit Description** - Update the entity's description
2. **Edit Poster/Image URL** - Change the display image
3. **Edit AI Summary** - Modify the "Why It's Scary" content
   - Edited summaries show a "Human Edited" badge
   - Original AI content is preserved for reference
4. **Trigger Integrations** - Re-run or trigger new integrations:
   - TMDB (for movies)
   - Google Books (for books)
   - MusicBrainz (for music)
   - Wikipedia (for general info)
5. **Regenerate AI Analysis** - Completely regenerate the AI analysis
6. **View History** - See all moderation actions for this entity

### Human Edited Content

When a moderator edits the AI summary:
- The original AI-generated content is preserved
- A "Human Edited" badge appears on the wiki page
- The edit is logged with timestamp and editor information

## Moderation Logs

All moderation actions are logged with:
- Action type
- User who performed the action
- Timestamp
- Details of what was changed (before/after values)

## Best Practices

### For Admins

1. **User Management**
   - Only promote trusted users to moderator or admin roles
   - Regularly review moderator activity
   - Keep admin accounts to a minimum

2. **Security**
   - Use strong passwords
   - Enable 2FA on your Google account (if using Google sign-in)
   - Regularly audit user roles

### For Moderators

1. **Content Editing**
   - Always verify information before editing
   - Preserve the helpful and informative tone
   - Use proper markdown formatting in AI summaries
   - Include sources when adding new information

2. **Integration Management**
   - Only re-trigger integrations when necessary
   - Verify integration data is correct before saving
   - Report any integration errors to admins

3. **AI Analysis**
   - Only regenerate analysis if it's significantly incorrect
   - Prefer editing over regeneration to preserve quality
   - Remember that regeneration overwrites all edits

## API Endpoints

### Admin Endpoints

- `GET /api/admin/users` - List users (admin only)
- `PATCH /api/admin/users` - Update user roles (admin only)

### Moderator Endpoints

- `PATCH /api/moderator/entities/[id]` - Update entity fields
- `POST /api/moderator/entities/[id]?action=edit-summary` - Edit AI summary
- `POST /api/moderator/entities/[id]?action=trigger-integration` - Trigger integration
- `POST /api/moderator/entities/[id]?action=regenerate-analysis` - Regenerate analysis
- `GET /api/moderator/entities/[id]/history` - Get moderation history

## Troubleshooting

### Can't Access Admin/Moderator Features

1. Verify your account has the correct role
2. Try signing out and back in
3. Clear browser cache and cookies
4. Contact an admin to verify your role

### Integration Failures

1. Check if the entity type matches the integration
2. Verify API keys are configured (admin task)
3. Try regenerating after a few minutes
4. Check moderation logs for error details

### Making Someone an Admin

If you need to make another user an admin:

1. Have them create an account first
2. Get their email address
3. Run: `npm run make-admin their-email@example.com`
4. Have them sign out and back in

## Database Schema

The system adds the following to the database:

- `UserRole` enum with USER, MODERATOR, ADMIN values
- `role` field on User model
- `ModeratorLog` model for audit logging
- `isHumanEdited`, `lastEditedBy`, `lastEditedAt` fields on ScaryAnalysis
- `whyScaryOriginal` field to preserve original AI content