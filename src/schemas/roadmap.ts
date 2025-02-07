import {
	check,
	length,
	maxLength,
	minValue,
	nanoid,
	nonEmpty,
	number,
	object,
	optional,
	partial,
	pipe,
	string,
} from "valibot";

export const CreateRoadmapSchema = object({
	name: pipe(
		string(),
		nonEmpty("Roadmap name cannot be empty"),
		maxLength(100, "Roadmap name cannot exceed 100 characters")
	),
	budget: optional(
		pipe(number(), minValue(0, "Roadmap budget cannot be lower than 0"))
	),
	commitment: string(),
	goal: pipe(
		string(),
		nonEmpty("Roadmap goal cannot be empty"),
		maxLength(500, "Roadmap goal cannot exceed 500 characters")
	),
	prerequisite: pipe(
		string(),
		length(25, "Invalid roadmap prerequisite id"),
		nanoid("Invalid roadmap prerequisite id")
	),
});

export const UpdateRoadmapSchema = pipe(
	partial(CreateRoadmapSchema),
	check(
		(v) => Object.keys(v).length > 0,
		"At least one field must be provided to update a resource"
	)
);
