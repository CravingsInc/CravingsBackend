import migrationData from '../migration.json';
import * as models from '../../models';

import { createEvent } from './createEvent';
import { createEventTicket } from './createEventTicket';
import { createEventsGallery } from './createEventsGallery';

import Stripe from "stripe";
import { stripe } from "../../utils/stripe";
import { stripeHandler } from '../../utils';
import { CreateOrganizerEventResponse, CreateOrganizerResponse } from '../types';


export const createOrganizerEvents = async ( orgs: CreateOrganizerResponse[], totalEvent: number = 4 ) => {
    let orgsEventsIds: CreateOrganizerEventResponse = {};

    console.log(`\nCreating events for organizers`);

    for ( let org of orgs ) {
        console.log(`\n\tCreating events for organizer: ${org.id}`);

        for ( let i = 0; i < totalEvent; i++ ) {
            let event = migrationData.events[ Math.floor( Math.random() * migrationData.events.length ) ];
            
            let existingProducts: { data: Stripe.Product[] };

            try {
                existingProducts = await stripe.products.list({
                    stripeAccount: org.stripeAccount
                });
            }catch( e ) {
                existingProducts = { data: [] };
            }
            
            // allows for no duplicate of product just to keep stripe test clean as possible
            const existingProduct = existingProducts.data.find(
                product => product.metadata?.eventIdentifier === `${org.id}-${event.title.replaceAll(" ", "-")}`
            );

            let eventSaved = await models.Events.findOneBy({ organizer: { id: org.id }, title: event.title });

            if ( existingProduct ) {

                if ( !eventSaved ) {
                    eventSaved = await createEvent( org.id, event );

                    orgsEventsIds[ org.id ] = orgsEventsIds[ org.id ] || [];
                    orgsEventsIds[ org.id ].push( eventSaved.id );
                }
            }else {
                if ( !eventSaved ) {
                    eventSaved = await createEvent( org.id, event );

                    try {
                        let stripeProduct = await stripeHandler.createEvent( org.stripeAccount, org.id, eventSaved.id, eventSaved.title, {
                            eventIdentifier: `${org.id}-${event.title.replaceAll(" ", "-")}`
                        });
    
                        eventSaved.productId = stripeProduct.id;
                        await eventSaved.save();

                        orgsEventsIds[ org.id ] = orgsEventsIds[ org.id ] || [];
                        orgsEventsIds[ org.id ].push( eventSaved.id );
                    }catch( e ) {
                        await eventSaved.remove(); // want to self clean database

                        eventSaved = null;
                    }
                }
            }

            if ( eventSaved ) {

                // Create event tickets in parallel to speed up the run time
                console.log(`\n\t\t\tCreating event tickets for: ${eventSaved.id}`);

                await Promise.all( event.tickets.map(
                    async ( price ) => {
                        await createEventTicket( price, eventSaved, org)
                    }
                ));

                // Create event gallery randomly
                createEventsGallery( eventSaved.id );
            }
        }
    }

    return orgsEventsIds;
}
