import migrationData from '../migration.json';
import * as models from '../../models';

export const createEvent = async ( orgId: string, event: typeof migrationData.events[number] ) => {
    const randomDate = Date.now() + Math.floor( Math.random() * 1e10 ); // Future timestamp
    const endDate = randomDate + Math.floor( Math.random() * 1e6 ); // End after a random date;

    let eventType: models.EventType;
    let is_monetized: boolean;
    let is_public = Math.floor( Math.random() * 2 ) === 0 ? true : false;;

    let randomType = Math.floor( Math.random() * 2 );

    switch ( randomType ) {
        case 0:
            eventType = models.EventType.PAID_TICKET;
            is_monetized = true;
            break;
        case 1:
            eventType = models.EventType.CYOP;
            is_monetized = true;
            break;
        default:
            eventType = models.EventType.REGISTRATION;
            is_monetized = Math.floor( Math.random() * 2 ) === 0 ? true : false;
            break;
    }

    let e = await models.Events.create({
        title: event.title,
        description: event.description.join('\n\n'),
        eventDate: new Date(randomDate),
        endEventDate: new Date(endDate),
        organizer: { id: orgId },
        banner: event.banner,
        visible: true,
        location: event.location,

        type: eventType,
        is_monetized,
        is_public
    }).save();

    console.log(`\n\t\tCreated event: ${e.id}`);

    return e;
}
