-- Add teacher_record_id column to teacher_classes for manual teachers
ALTER TABLE teacher_classes 
ADD COLUMN teacher_record_id UUID REFERENCES teachers(id) ON DELETE CASCADE;

-- Make teacher_id nullable since we'll use teacher_record_id for manual teachers
ALTER TABLE teacher_classes 
ALTER COLUMN teacher_id DROP NOT NULL;

-- Add check constraint to ensure at least one ID is present
ALTER TABLE teacher_classes 
ADD CONSTRAINT teacher_reference_check 
CHECK (teacher_id IS NOT NULL OR teacher_record_id IS NOT NULL);