import migrationData from '../migration.json';
import * as models from '../../models';
import { CreateEventGalleryResponse } from '../types';

export const createEventsGallery = async ( eventId: string, totalGallerySize: number = 10 ) => {
    let galleryIds: CreateEventGalleryResponse = [];

    console.log(`\n\t\t\tCreating gallery for event: ${eventId}`);

    for ( let i = 0; i < totalGallerySize; i++ ) {
        let picture = migrationData.gallery[ Math.floor( Math.random() * migrationData.gallery.length ) ]; // Picks random picture

        if ( await models.EventPhotos.findOneBy({ picture, event: { id: eventId } }) ) continue; // If it exists go to next gallery implementation

        let gallery = await models.EventPhotos.create({
            picture,
            event: { id: eventId }
        }).save();

        galleryIds.push( gallery.id );

        console.log(`\n\t\t\t\tCreated Gallery: ${gallery.id}`);
    }

    return galleryIds;
}
