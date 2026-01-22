-- Normalize class_id in exams table to lowercase without spaces
UPDATE exams SET class_id = LOWER(REPLACE(class_id, ' ', ''))
WHERE class_id IS NOT NULL AND class_id <> LOWER(REPLACE(class_id, ' ', ''));

-- Normalize class_id in students table to lowercase without spaces  
UPDATE students SET class_id = LOWER(REPLACE(class_id, ' ', ''))
WHERE class_id IS NOT NULL AND class_id <> LOWER(REPLACE(class_id, ' ', ''));

-- Normalize class_id in assignments table
UPDATE assignments SET class_id = LOWER(REPLACE(class_id, ' ', ''))
WHERE class_id IS NOT NULL AND class_id <> LOWER(REPLACE(class_id, ' ', ''));

-- Normalize class_id in online_classes table
UPDATE online_classes SET class_id = LOWER(REPLACE(class_id, ' ', ''))
WHERE class_id IS NOT NULL AND class_id <> LOWER(REPLACE(class_id, ' ', ''));

-- Normalize class_id in learning_materials table
UPDATE learning_materials SET class_id = LOWER(REPLACE(class_id, ' ', ''))
WHERE class_id IS NOT NULL AND class_id <> LOWER(REPLACE(class_id, ' ', ''));

-- Normalize class_id in fee_payments table
UPDATE fee_payments SET class_id = LOWER(REPLACE(class_id, ' ', ''))
WHERE class_id IS NOT NULL AND class_id <> LOWER(REPLACE(class_id, ' ', ''));

-- Normalize class_id in fee_structures table
UPDATE fee_structures SET class_id = LOWER(REPLACE(class_id, ' ', ''))
WHERE class_id IS NOT NULL AND class_id <> LOWER(REPLACE(class_id, ' ', ''));

-- Normalize class_id in report_cards table
UPDATE report_cards SET class_id = LOWER(REPLACE(class_id, ' ', ''))
WHERE class_id IS NOT NULL AND class_id <> LOWER(REPLACE(class_id, ' ', ''));