import { CreateOrganizerResponse } from "../types";
import { createOrganizerEvents } from "./createOrganizerEvents";
import { createSampleCoupons } from "./createCoupons";

export const runEvents = async (orgs: CreateOrganizerResponse[]) => {
    let orgsEvents = await createOrganizerEvents(orgs);

    // Create sample coupons for testing
    await createSampleCoupons(orgsEvents);

    return {
        orgsEvents
    }
}