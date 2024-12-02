import { CreateUsersResponse } from "../types";
import { createOrganizer } from "./createOrganizer";
import { userRandomFollowOrganizer } from "./userRandomFollowerOrganizer";

export const orgRun = async ( userIds: CreateUsersResponse ) => {
    let orgIds = await createOrganizer();

    let userRandomFollowOrgsIds = await userRandomFollowOrganizer( userIds, orgIds );

    return {
        orgIds,
        userRandomFollowOrgsIds
    }
}
