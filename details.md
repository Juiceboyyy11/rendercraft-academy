I'll provide you with comprehensive details about the academy course and admin system for handover to another developer.


[6 tools called]

# **RenderCraft Academy - Complete Developer Handover Documentation**

## **🏗️ Project Overview**

**RenderCraft Academy** is a Next.js-based online learning platform for 3D animation courses. It features a comprehensive admin system for course management and a student-facing academy interface.

### **Key Features:**
- **Course Management System** (Courses → Sections → Lessons/Assignments)
- **Admin Dashboard** with full CRUD operations
- **Student Authentication** and course access control
- **Rich Text Editor** for course descriptions
- **File Upload System** for thumbnails and assignments
- **Responsive Design** with Tailwind CSS

---

## **🛠️ Technical Stack**

### **Frontend:**
- **Next.js 14** (App Router)
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Custom Fonts** (Lato + Sentex)

### **Backend & Database:**
- **Supabase** (PostgreSQL + Auth + Storage)
- **Row Level Security (RLS)** policies
- **Real-time subscriptions**

### **Key Dependencies:**
```json
{
  "@supabase/supabase-js": "^2.38.0",
  "@tailwindcss/typography": "^0.5.19",
  "lucide-react": "^0.292.0",
  "react-hook-form": "^7.47.0",
  "react-hot-toast": "^2.4.1"
}
```

---

## **🗄️ Database Schema**

### **Core Tables:**

#### **1. Users Table**
```sql
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **2. Courses Table**
```sql
CREATE TABLE public.courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT, -- Rich HTML content
  thumbnail_url TEXT,
  price DECIMAL(10,2) DEFAULT 0.00,
  is_free BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **3. Course Sections Table**
```sql
CREATE TABLE public.course_sections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- "Week 1", "Week 2", etc.
  description TEXT,
  section_order INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, section_order)
);
```

#### **4. Lessons Table**
```sql
CREATE TABLE public.lessons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section_id UUID REFERENCES public.course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT, -- YouTube URLs
  video_duration INTEGER, -- in seconds
  lesson_order INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(section_id, lesson_order)
);
```

#### **5. Assignments Table**
```sql
CREATE TABLE public.assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section_id UUID REFERENCES public.course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT, -- Rich text instructions
  due_date TIMESTAMP WITH TIME ZONE,
  max_points INTEGER DEFAULT 100,
  assignment_order INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(section_id, assignment_order)
);
```

#### **6. Assignment Submissions Table**
```sql
CREATE TABLE public.assignment_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  submission_text TEXT,
  submission_files TEXT[], -- Array of file URLs
  points_earned INTEGER DEFAULT 0,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES public.users(id),
  UNIQUE(assignment_id, user_id)
);
```

---

## **🔐 Authentication & Authorization**

### **Admin System:**
- **Admin Email:** `iamthatlolu@gmail.com` (configured in `lib/admin.ts`)
- **Admin Check:** Email-based verification
- **Admin Access:** Automatic admin panel access when logged in with admin email

### **RLS Policies:**
- **Courses:** Users can view published courses, admins can manage all
- **Storage:** Admin-only upload access to `course-thumbnails` bucket
- **Users:** Users can view/update their own profiles

---

## **📁 File Structure**

```
├── app/
│   ├── academy/page.tsx          # Main academy homepage
│   ├── admin/page.tsx            # Admin dashboard
│   ├── course/[id]/page.tsx      # Course detail page
│   ├── auth/signin/page.tsx      # Student login
│   ├── globals.css               # Global styles + fonts
│   └── layout.tsx                # Root layout
├── components/
│   ├── Header.tsx                # Navigation component
│   └── admin/
│       ├── CourseManagement.tsx   # Main admin interface
│       ├── CreateSectionForm.tsx  # Section creation
│       ├── CreateLessonForm.tsx   # Lesson creation
│       └── RichTextEditor.tsx    # Custom rich text editor
├── lib/
│   ├── supabase.ts               # Supabase client + types
│   └── admin.ts                  # Admin utilities
├── database/
│   ├── schema.sql                # Complete database schema
│   └── migration.sql             # Migration script
└── public/
    ├── hero showreel.webp        # Hero background
    └── font/Sentex-Regular.ttf   # Custom font
```

---

## **🎨 UI/UX Design**

### **Design System:**
- **Primary Colors:** Black background with white text
- **Accent Colors:** White/transparent overlays
- **Typography:** Lato (body) + Sentex (branding)
- **Layout:** Single-page academy with smooth scrolling

### **Key Pages:**

#### **1. Academy Homepage (`/academy`)**
- **Hero Section:** Full-screen video background with overlay
- **Course Cards:** Thumbnail, title, description, pricing
- **Access Control:** Sign-in required for course access
- **Responsive:** Mobile-first design

#### **2. Admin Dashboard (`/admin`)**
- **Course Management:** Compact card layout
- **CRUD Operations:** Create/edit courses, sections, lessons
- **Rich Text Editor:** Custom toolbar with formatting
- **File Upload:** Thumbnail management

---

## **⚙️ Configuration**

### **Environment Variables:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://itcitfscjmvtgtleainu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_key
```

### **Supabase Setup Required:**
1. **Storage Bucket:** `course-thumbnails` with RLS policies
2. **RLS Policies:** For all tables (see `database/schema.sql`)
3. **Admin Email:** Update `lib/admin.ts` with actual admin email

---

## **🚀 Development Commands**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## **🔧 Key Components**

### **1. CourseManagement Component**
- **Location:** `components/admin/CourseManagement.tsx`
- **Purpose:** Main admin interface for course management
- **Features:**
  - Course listing with compact cards
  - Expandable sections and lessons
  - Publish/unpublish controls
  - Add sections and lessons

### **2. RichTextEditor Component**
- **Location:** `components/admin/RichTextEditor.tsx`
- **Purpose:** Custom rich text editor for course descriptions
- **Features:**
  - Bold, italic, headings
  - Lists, alignment, colors
  - Links, horizontal rules
  - Undo/redo functionality

### **3. Academy Page**
- **Location:** `app/academy/page.tsx`
- **Purpose:** Student-facing course listing
- **Features:**
  - Hero section with video background
  - Course cards with thumbnails
  - Access control (sign-in required)
  - Responsive design

---

## **📊 Current Status**

### **✅ Completed Features:**
- Database schema with proper relationships
- Admin course management system
- Student authentication
- Course listing page
- Rich text editor
- File upload system
- Responsive design

### **⚠️ Known Issues:**
- Course detail page navigation (currently simplified for debugging)
- Some RLS policies may need adjustment
- Assignment submission system needs implementation

### **🔄 Pending Features:**
- Video player integration
- Assignment submission system
- Course progress tracking
- Payment integration
- Comment system
- Certificate generation

---

## **🛠️ Setup Instructions for New Developer**

### **1. Environment Setup:**
```bash
# Clone repository
git clone [repository-url]
cd Portfolio

# Install dependencies
npm install

# Create environment file
cp env.example .env.local
# Edit .env.local with actual Supabase credentials
```

### **2. Database Setup:**
```sql
-- Run schema.sql in Supabase SQL editor
-- Run migration.sql if migrating existing data
-- Create course-thumbnails storage bucket
-- Set up RLS policies
```

### **3. Admin Configuration:**
```typescript
// Update lib/admin.ts
const ADMIN_EMAIL = 'your-admin-email@domain.com'
```

### **4. Start Development:**
```bash
npm run dev
# Visit http://localhost:3001/academy
# Login with admin email to access admin panel
```

---

## **📞 Support & Maintenance**

### **Critical Files to Monitor:**
- `lib/supabase.ts` - Database connection
- `lib/admin.ts` - Admin configuration
- `database/schema.sql` - Database structure
- `components/admin/CourseManagement.tsx` - Core admin functionality

### **Common Issues:**
1. **RLS Policy Errors:** Check Supabase policies
2. **File Upload Issues:** Verify storage bucket permissions
3. **Admin Access:** Confirm email in `lib/admin.ts`
4. **Navigation Issues:** Check Next.js routing

This documentation provides a complete overview of the RenderCraft Academy system for seamless developer handover.