import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, LoadEvent } from "typeorm";

@EventSubscriber()
export class DateNormalizerSubscriber implements EntitySubscriberInterface {
    beforeInsert(event: InsertEvent<any>) {
        this.normalizeDates(event.entity);
    }

    beforeUpdate(event: UpdateEvent<any>) {
        this.normalizeDates(event.entity);
    }

    afterLoad(entity: any, event?: LoadEvent<any>) {
        this.normalizeDates(entity);
    }

    private normalizeDates(entity: any) {
        if (!entity) return;
        for (const key of Object.keys(entity)) {
            if (entity[key] instanceof Date) {
                // Ensure it's stored in UTC
                entity[key] = new Date(entity[key].toISOString());
            }
        }
    }
}
