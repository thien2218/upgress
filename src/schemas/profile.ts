import {
	check,
	maxLength,
	minLength,
	object,
	optional,
	partial,
	pipe,
	startsWith,
	string,
	url,
} from "valibot";

export const OnboardSchema = object({
	firstName: pipe(
		string(),
		minLength(2, "First name must be at least 2 characters long"),
		maxLength(50, "First name must be at most 50 characters long")
	),
	lastName: pipe(
		string(),
		minLength(2, "Last name must be at least 2 characters long"),
		maxLength(50, "Last name must be at most 50 characters long")
	),
	profileImage: optional(
		pipe(
			string(),
			url("Profile image source must be a valid URL"),
			startsWith("https://", "Profile image source must be secure")
		)
	),
	bio: optional(string()),
});

export const UpdateProfileSchema = pipe(
	partial(OnboardSchema),
	check(
		(v) => Object.keys(v).length > 0,
		"At least one field must be provided to update a milestone"
	)
);
