export type CreateOrganizerResponse = {
    id: string;
    stripeAccount: string
}

export type UserRandomFollowOrganizer = Record<string, string[]>;
