import {
	check,
	maxLength,
	minValue,
	nonEmpty,
	number,
	object,
	optional,
	partial,
	pipe,
	startsWith,
	string,
	transform,
	url,
} from "valibot";

export const CreateResourceSchema = object({
	name: pipe(
		string(),
		nonEmpty("Resource name connot be empty"),
		maxLength(150, "Resource name length cannot exceed 150")
	),
	description: optional(
		pipe(string(), nonEmpty("Resource description connot be empty"))
	),
	type: pipe(
		string(),
		nonEmpty("Resource type connot be empty"),
		maxLength(20, "Resource type length cannot exceed 20")
	),
	link: pipe(
		string(),
		url("Resource reference link must be a valid URL"),
		startsWith("https://", "Resource reference link must be secure")
	),
	cost: optional(
		pipe(
			string(),
			transform((input) => parseFloat(input)),
			number(),
			minValue(0, "Cost cannot be lower than 0")
		)
	),
});

export const UpdateResourceSchema = pipe(
	partial(CreateResourceSchema),
	check(
		(v) => Object.keys(v).length > 0,
		"At least one field must be provided to update a resource"
	)
);
