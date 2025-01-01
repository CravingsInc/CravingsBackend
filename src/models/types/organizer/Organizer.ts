import { InputType, Field } from "type-graphql";

@InputType()
export class CreateOrganizerMemberInput {
    
    @Field()
    name: string;

    @Field()
    email: string;

    @Field()
    phoneNumber: string;

    @Field()
    role: 'Admin' | "Member" | "Guest";
}
