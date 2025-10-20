# دليل استكشاف الأخطاء وإصلاحها

## 🔧 المشاكل الشائعة وحلولها

### 1️⃣ مشكلة: لا يمكن تسجيل الدخول

**الأعراض:**
- رسالة خطأ عند محاولة تسجيل الدخول
- "Invalid credentials" أو "بيانات غير صحيحة"

**الحلول:**

#### أ) تأكد من تشغيل جميع السكريبتات بالترتيب:

\`\`\`bash
# في Supabase SQL Editor، قم بتشغيل السكريبتات بالترتيب:
1. scripts/001_setup_rls_policies.sql
2. scripts/002_add_indexes_and_functions.sql
3. scripts/003_create_admin_user.sql
4. scripts/004_add_files_table.sql
5. scripts/005_add_demo_users_and_data.sql
\`\`\`

#### ب) تحقق من إنشاء المستخدم في Supabase Auth:

1. افتح Supabase Dashboard
2. اذهب إلى **Authentication** → **Users**
3. تأكد من وجود المستخدمين
4. إذا لم يكونوا موجودين، قم بإنشائهم يدوياً:
   - Email: `admin@crm.com`
   - Password: `admin123`
   - ثم أضف سجل في جدول `employees` بنفس الـ `id` من Auth

---

### 2️⃣ مشكلة: متغيرات البيئة غير موجودة

**الأعراض:**
- خطأ "SUPABASE_URL is not defined"
- النظام لا يتصل بقاعدة البيانات

**الحلول:**

#### تحقق من وجود المتغيرات التالية في مشروعك:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
\`\`\`

#### كيفية الحصول على المتغيرات:

1. افتح Supabase Dashboard
2. اذهب إلى **Settings** → **API**
3. انسخ:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

---

### 3️⃣ مشكلة: التحديثات الفورية (Realtime) لا تعمل

**الأعراض:**
- التغييرات لا تظهر تلقائياً
- يجب تحديث الصفحة لرؤية البيانات الجديدة
- مؤشر الاتصال يظهر "غير متصل"

**الحلول:**

#### أ) تفعيل Realtime في Supabase:

1. افتح Supabase Dashboard
2. اذهب إلى **Database** → **Replication**
3. تأكد من تفعيل Realtime للجداول التالية:
   - ✅ `employees`
   - ✅ `customers`
   - ✅ `notes`
   - ✅ `notifications`
   - ✅ `phone_numbers`
   - ✅ `quotations`
   - ✅ `files`

#### ب) تحقق من سياسات RLS:

قم بتشغيل هذا الاستعلام للتحقق:

\`\`\`sql
-- تحقق من تفعيل RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- يجب أن تكون rowsecurity = true لجميع الجداول
\`\`\`

#### ج) تحقق من الاتصال في المتصفح:

1. افتح Developer Tools (F12)
2. اذهب إلى **Console**
3. ابحث عن رسائل خطأ تتعلق بـ WebSocket أو Realtime
4. إذا وجدت خطأ CORS، تأكد من إضافة نطاقك في Supabase:
   - **Settings** → **API** → **URL Configuration**

---

### 4️⃣ مشكلة: خطأ "Permission denied" عند الوصول للبيانات

**الأعراض:**
- رسالة "new row violates row-level security policy"
- لا يمكن قراءة أو كتابة البيانات

**الحلول:**

#### أ) تحقق من سياسات RLS:

قم بتشغيل السكريبت التالي للتحقق من السياسات:

\`\`\`sql
-- عرض جميع السياسات
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
\`\`\`

#### ب) إعادة تطبيق السياسات:

إذا كانت السياسات مفقودة، قم بتشغيل:

\`\`\`bash
scripts/001_setup_rls_policies.sql
\`\`\`

#### ج) تحقق من دور المستخدم:

\`\`\`sql
-- تحقق من دور المستخدم الحالي
SELECT id, email, role FROM employees WHERE id = auth.uid();
\`\`\`

---

### 5️⃣ مشكلة: الأرقام تتكرر رغم وجود دالة منع التكرار

**الأعراض:**
- يمكن إضافة نفس رقم الهاتف مرتين
- دالة `normalize_phone` لا تعمل

**الحلول:**

#### أ) تحقق من وجود الدالة والـ Trigger:

\`\`\`sql
-- تحقق من وجود الدالة
SELECT proname FROM pg_proc WHERE proname = 'normalize_phone';

-- تحقق من وجود الـ Trigger
SELECT tgname FROM pg_trigger WHERE tgname = 'normalize_customer_phone';
\`\`\`

#### ب) إعادة إنشاء الدالة والـ Trigger:

\`\`\`bash
scripts/002_add_indexes_and_functions.sql
\`\`\`

#### ج) اختبار الدالة يدوياً:

\`\`\`sql
-- اختبر تطبيع الأرقام
SELECT normalize_phone('0501234567');  -- يجب أن يعيد: 966501234567
SELECT normalize_phone('501234567');   -- يجب أن يعيد: 966501234567
SELECT normalize_phone('+966501234567'); -- يجب أن يعيد: 966501234567
\`\`\`

---

### 6️⃣ مشكلة: رفع الملفات لا يعمل

**الأعراض:**
- خطأ عند محاولة رفع صورة أو ملف
- "Storage bucket not found"

**الحلول:**

#### أ) إنشاء Storage Bucket في Supabase:

1. افتح Supabase Dashboard
2. اذهب إلى **Storage**
3. أنشئ bucket جديد باسم `crm-files`
4. اجعله **Public** إذا كنت تريد الوصول المباشر للملفات

#### ب) تحديث سياسات Storage:

\`\`\`sql
-- سياسة للسماح بالرفع
CREATE POLICY "Employees can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'crm-files' AND
  auth.role() = 'authenticated'
);

-- سياسة للسماح بالقراءة
CREATE POLICY "Anyone can view files"
ON storage.objects FOR SELECT
USING (bucket_id = 'crm-files');
\`\`\`

---

### 7️⃣ مشكلة: الواجهة لا تظهر بالعربية بشكل صحيح

**الأعراض:**
- النصوص تظهر من اليسار لليمين
- الخط غير واضح

**الحلول:**

#### أ) تحقق من تحميل خط Cairo:

افتح Developer Tools وتحقق من تحميل الخط في **Network** tab

#### ب) تأكد من وجود `dir="rtl"` في HTML:

\`\`\`typescript
// في app/layout.tsx
<html lang="ar" dir="rtl">
\`\`\`

#### ج) امسح الـ Cache:

\`\`\`bash
# في المتصفح
Ctrl + Shift + Delete → Clear Cache
\`\`\`

---

## 🔍 أدوات التشخيص

### سكريبت فحص شامل للنظام:

قم بتشغيل هذا السكريبت في Supabase SQL Editor للحصول على تقرير كامل:

\`\`\`sql
-- تقرير حالة النظام
SELECT 
  'Tables' as check_type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public'

UNION ALL

SELECT 
  'RLS Enabled Tables',
  COUNT(*)
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true

UNION ALL

SELECT 
  'Policies',
  COUNT(*)
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'Functions',
  COUNT(*)
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace

UNION ALL

SELECT 
  'Triggers',
  COUNT(*)
FROM pg_trigger 
WHERE tgrelid IN (
  SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace
)

UNION ALL

SELECT 
  'Employees',
  COUNT(*)
FROM employees

UNION ALL

SELECT 
  'Customers',
  COUNT(*)
FROM customers;
\`\`\`

---

## 📞 الحصول على المساعدة

إذا استمرت المشكلة بعد تجربة الحلول أعلاه:

1. تحقق من **Supabase Logs**:
   - Dashboard → **Logs** → **Postgres Logs**
   
2. تحقق من **Browser Console**:
   - F12 → Console → ابحث عن رسائل الخطأ

3. تحقق من **Network Tab**:
   - F12 → Network → ابحث عن طلبات فاشلة (حمراء)

4. راجع ملف **README.md** للتأكد من اتباع جميع خطوات الإعداد

---

## ✅ قائمة التحقق السريعة

قبل البدء باستخدام النظام، تأكد من:

- [ ] تشغيل جميع السكريبتات (001 إلى 005)
- [ ] إضافة متغيرات البيئة الثلاثة
- [ ] تفعيل Realtime لجميع الجداول
- [ ] إنشاء Storage Bucket باسم `crm-files`
- [ ] تسجيل الدخول بحساب المدير للتأكد من عمل النظام
- [ ] فتح Developer Tools والتحقق من عدم وجود أخطاء

---

**آخر تحديث:** 2024
