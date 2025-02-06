import {
	check,
	email,
	forward,
	InferInput,
	maxLength,
	minLength,
	object,
	optional,
	pipe,
	startsWith,
	string,
	toLowerCase,
	transform,
	union,
	url,
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

export type LoginPayload = InferInput<typeof LoginSchema>;
export type SignupPayload = InferInput<typeof SignupSchema>;
export type OnboardPayload = InferInput<typeof OnboardSchema>;
