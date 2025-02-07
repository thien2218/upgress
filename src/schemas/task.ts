import {
	check,
	date,
	maxLength,
	maxValue,
	minValue,
	nonEmpty,
	number,
	object,
	optional,
	partial,
	picklist,
	pipe,
	string,
} from "valibot";

export const CreateTaskSchema = object({
	description: pipe(
		string(),
		nonEmpty("Task description cannot be empty"),
		maxLength(500, "Task description must be 500 characters or less")
	),
	priority: pipe(
		number(),
		minValue(1, "Task priority's value cannot be smaller than 1"),
		maxValue(5, "Task priority's value cannot be greater than 5")
	),
	difficulty: pipe(
		number(),
		minValue(1, "Task priority's value cannot be smaller than 1"),
		maxValue(5, "Task priority's value cannot be greater than 5")
	),
	status: picklist(["pending", "in-progress", "completed"]),
	dueDate: optional(date()),
});

export const UpdateTaskSchema = pipe(
	partial(CreateTaskSchema),
	check(
		(v) => Object.keys(v).length > 0,
		"At least one field must be provided to update a task"
	)
);
