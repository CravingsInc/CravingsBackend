import { CreateUsersResponse } from "../types";
import { createOrganizer } from "./createOrganizer";
import { createOrganizerTeamMembers } from "./createOrganizerTeamMember";
import { userRandomFollowOrganizer } from "./userRandomFollowerOrganizer";

export const orgRun = async ( userIds: CreateUsersResponse ) => {
    let orgIds = await createOrganizer();

    let userRandomFollowOrgsIds = await userRandomFollowOrganizer( userIds, orgIds );

    let randomOrgTeamMembersIds = await createOrganizerTeamMembers( orgIds );

    return {
        orgIds,
        userRandomFollowOrgsIds,
        randomOrgTeamMembersIds
    }
}
