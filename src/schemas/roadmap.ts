import {
	array,
	check,
	integer,
	length,
	maxLength,
	maxValue,
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
	commitment: pipe(
		number(),
		integer("Number of hours committed per week must be an integer"),
		minValue(1, "Number of hours committed per week cannot be less than 1"),
		maxValue(
			100,
			"Number of hours committed per week cannot be greater than 100"
		)
	),
	goals: pipe(
		array(
			pipe(
				string(),
				nonEmpty("Goal must be specified"),
				maxLength(250, "Goal cannot have more than 250 characters")
			)
		),
		nonEmpty("There must be at least one goal for the roadmap"),
		maxLength(50, "There shouldn't be too many goals for one roadmap")
	),
	prerequisite: optional(
		pipe(
			string(),
			length(25, "Invalid roadmap prerequisite id"),
			nanoid("Invalid roadmap prerequisite id")
		)
	),
});

export const UpdateRoadmapSchema = pipe(
	partial(CreateRoadmapSchema),
	check(
		(v) => Object.keys(v).length > 0,
		"At least one field must be provided to update a resource"
	)
);
