import {
	check,
	email,
	forward,
	InferInput,
	maxLength,
	minLength,
	object,
	pipe,
	string,
	toLowerCase,
	transform,
	union,
} from "valibot";

const EmailSchema = pipe(
	string(),
	email("Invalid email address"),
	maxLength(60, "Email is too long"),
	toLowerCase(),
	check(
		(e) => !e.includes("+"),
		"We don't support email address that contains character '+'"
	)
);

export const LoginSchema = object({
	email: EmailSchema,
	password: pipe(
		string(),
		minLength(8, "Password must be at least 3 characters long"),
		maxLength(24, "Password must be at most 24 characters long")
	),
});

export const SignupSchema = pipe(
	object({
		email: EmailSchema,
		password: pipe(
			string(),
			minLength(8, "Password must be at least 3 characters long"),
			maxLength(24, "Password must be at least 3 characters long")
		),
		confirmPassword: string(),
	}),
	forward(
		check(
			({ password, confirmPassword }) => password === confirmPassword,
			"Passwords do not match"
		),
		["confirmPassword"]
	),
	transform(({ confirmPassword, ...rest }) => rest)
);

export type LoginPayload = InferInput<typeof LoginSchema>;
export type SignupPayload = InferInput<typeof SignupSchema>;
