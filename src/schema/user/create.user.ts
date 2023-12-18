import { InputType, Field, ObjectType } from "type-graphql";

@InputType()
export class CreateUserInput {
  @Field(() => String)
  email: String;

  @Field(() => String)
  password: String;
}
@ObjectType()
export class CreateUserOutput {
  @Field(() => [String])
  message: String[];
}
