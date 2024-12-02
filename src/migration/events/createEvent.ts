import migrationData from '../migration.json';
import * as models from '../../models';

export const createEvent = async ( orgId: string, event: typeof migrationData.events[number] ) => {
    const randomDate = Date.now() + Math.floor( Math.random() * 1e10 ); // Future timestamp
    const endDate = randomDate + Math.floor( Math.random() * 1e6 ); // End after a random date;

    let e = await models.Events.create({
        title: event.title,
        description: event.description.join('\n\n'),
        eventDate: new Date(randomDate),
        endEventDate: new Date(endDate),
        organizer: { id: orgId },
        banner: event.banner,
        visible: true,
        location: event.location,
    }).save();

    console.log(`\n\t\tCreated event: ${e.id}`);

    return e;
}
