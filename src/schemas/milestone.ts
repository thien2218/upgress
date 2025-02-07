import {
	check,
	date,
	maxLength,
	nonEmpty,
	object,
	optional,
	partial,
	pipe,
	string,
} from "valibot";

export const CreateMilestoneSchema = object({
	target: pipe(
		string(),
		nonEmpty("Milestone target cannot be empty"),
		maxLength(100, "Milestone target cannot be longer than 100 characters")
	),
	deadline: date(),
	description: optional(
		pipe(
			string(),
			nonEmpty("Milestone description cannot be empty"),
			maxLength(
				500,
				"Milestone description cannot be longer than 500 characters"
			)
		)
	),
});

export const UpdateMilestoneSchema = pipe(
	partial(CreateMilestoneSchema),
	check(
		(v) => Object.keys(v).length > 0,
		"At least one field must be provided to update a milestone"
	)
);
