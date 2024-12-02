import { createUsers } from "./createUsers";
import { userRandomFollow } from "./userRandomFollow";

export const runUsers = async () => {
    let userIds = await createUsers();
    let randomUsersFollowerRecord = await userRandomFollow( userIds );

    return {
        userIds,
        randomUsersFollowerRecord
    }
}
