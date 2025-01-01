export type CreateOrganizerResponse = {
    id: string;
    stripeAccount: string
}

export type UserRandomFollowOrganizerResponse = Record<string, string[]>;

export type createOrganizerTeamMembersResponse = Record<string, string[]>;
