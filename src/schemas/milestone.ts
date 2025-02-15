import {
	array,
	check,
	integer,
	length,
	maxLength,
	nanoid,
	nonEmpty,
	number,
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
	estTime: pipe(number(), integer()),
	description: optional(
		pipe(
			string(),
			nonEmpty("Milestone description cannot be empty"),
			maxLength(
				500,
				"Milestone description should not be longer than 500 characters"
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

export const ReorderMilestoneSchema = pipe(
	object({
		milestoneIds: pipe(
			array(
				pipe(
					string(),
					length(25, "Invalid milestone ID"),
					nanoid("Invalid milestone ID")
				)
			),
			nonEmpty("List of milestone to reorder cannot be empty")
		),
		minOrder: pipe(
			number(),
			integer("Minimum order number must be an integer")
		),
	})
);
