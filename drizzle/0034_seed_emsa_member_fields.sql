INSERT INTO "member_field_definitions" ("key", "label", "type", "required", "suggestions", "order")
SELECT v.key, v.label, v.type::"member_field_type", v.required, v.suggestions, v.ord
FROM (VALUES
	('phone', 'Phone', 'TEXT', true, false, 0),
	('index', 'Student index', 'TEXT', true, false, 1),
	('yearOfStudies', 'Year of studies', 'NUMBER', true, false, 2),
	('university', 'University', 'TEXT', false, true, 3)
) AS v(key, label, type, required, suggestions, ord)
WHERE EXISTS (
	SELECT 1 FROM "users"
	WHERE phone IS NOT NULL OR student_index IS NOT NULL
		OR year_of_studies IS NOT NULL OR university IS NOT NULL
);--> statement-breakpoint
UPDATE "users" SET custom_fields = custom_fields || jsonb_strip_nulls(jsonb_build_object(
	'phone', nullif(btrim(phone), ''),
	'index', nullif(btrim(student_index), ''),
	'yearOfStudies', year_of_studies,
	'university', nullif(btrim(university), '')
));--> statement-breakpoint
UPDATE "users" u SET profile_completed = coalesce((
	SELECT bool_and(nullif(btrim(u.custom_fields->>d.key), '') IS NOT NULL)
	FROM "member_field_definitions" d WHERE d.required
), true);
