import { CreateOrganizerResponse } from "../types";
import { createOrganizerEvents } from "./createOrganizerEvents";

export const runEvents = async ( orgs: CreateOrganizerResponse[] ) => {
    let orgsEvents = await createOrganizerEvents( orgs );

    return {
        orgsEvents
    }
}