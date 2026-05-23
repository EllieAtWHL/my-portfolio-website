# My Portfolio Website

> **📋 Project Architecture:** See `reference/PROJECT_CONTEXT.md` for the complete architectural guide, technical decisions, and project boundaries.

This is a [Next.js](https://nextjs.org) project that consolidates my personal portfolio and an unofficial Spurs Women fan site into a single application.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Admin System

This project includes a web-based admin interface for managing Spurs Women's football data in the Supabase database.

### 🛠️ Admin Features

- **Admin UI**: Located at `/admin` - A React-based interface with tabbed navigation for managing different data entities
- **Authentication**: Supabase Auth with email-based authorization (restricted to a single admin email)
- **API Routes**: Server-side API endpoints for CRUD operations on all data entities
- **Data Management**: Manage matches, media, teams, players, player stats, player history, stadiums, and stadium names

### 📚 Admin Documentation

For detailed information about the admin system, see:
- **Complete Guide**: [`reference/spurs-women/admin/ADMIN_SYSTEM_DOCUMENTATION.md`](./reference/spurs-women/admin/ADMIN_SYSTEM_DOCUMENTATION.md) - Full documentation including architecture, API routes, data entities, and security considerations

### Key Capabilities

- **Match Management**: Create and view match records with scores, venues, and attendance
- **Media Management**: Link photos, articles, and social media content to matches
- **Team & Player Data**: Manage team information and player profiles with statistics
- **Stadium Information**: Maintain stadium details and historical name changes
- **Secure Operations**: All admin operations require authentication and authorization checks

## Environment Variables

Required environment variables (see `.env.local` for reference):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Admin Authorization
ADMIN_EMAIL=admin@example.com

# FullStory (optional)
NEXT_PUBLIC_FULLSTORY_ORG=your_fullstory_org_id
```

## Analytics & Monitoring

This site uses FullStory for user session recording and analytics:

### 📊 FullStory Implementation

- **Overview**: [`reference/fullstory/README.md`](./reference/fullstory/README.md) - Documentation index and quick start
- **Documentation**: [`reference/fullstory/fullstory-implementation.md`](./reference/fullstory/fullstory-implementation.md) - Complete implementation guide
- **Technical Guide**: [`reference/fullstory/fullstory-technical-guide.md`](./reference/fullstory/fullstory-technical-guide.md) - Developer documentation
- **Quick Reference**: [`reference/fullstory/fullstory-quick-reference.md`](./reference/fullstory/fullstory-quick-reference.md) - Common tasks and troubleshooting

#### Key Features
- Session recording and replay
- User behavior analytics
- Custom event tracking
- Environment-based data separation
- Privacy-compliant data collection

#### Files Involved
- `/public/fullstory-init.js` - FullStory initialization script
- `/src/app/layout.tsx` - Root layout with script integration

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
