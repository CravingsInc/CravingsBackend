import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class OrganizerSettingsUserResponse {
    @Field( () => ID ) id: string;

    @Field() name: string;

    @Field() phoneNumber: string;

    @Field() profilePicture: string;

    @Field() title: string;

    @Field() email: string;
}

@ObjectType()
export class OrganizerSettingsOrgResponse {
    @Field( () => ID ) id: string;

    @Field() banner: string;

    @Field() orgName: string;

    @Field() email: string;

    @Field() phoneNumber: string;

    @Field() location: string;

    @Field() profilePicture: string;
}

@ObjectType()
export class OrganizerSettingsTeamsResponse {
    @Field( () => ID ) id: string;

    @Field() name: string;

    @Field() type: "Organizer" | 'Admin' | "Member" | "Guest";

    @Field() joinedDate: Date;

    @Field() profilePicture: string;

    @Field() email: string;
}

@ObjectType()
export class OrganizerSettingsPageResponse {
    @Field() isOrg: boolean;

    @Field( () => OrganizerSettingsUserResponse, { nullable: true } ) user?: OrganizerSettingsUserResponse;

    @Field( () => OrganizerSettingsOrgResponse ) organizer: OrganizerSettingsOrgResponse;

    @Field( () => [OrganizerSettingsTeamsResponse] ) teams: OrganizerSettingsTeamsResponse[];

}