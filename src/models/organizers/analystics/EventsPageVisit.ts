import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, ManyToOne } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Users } from "../../users";
import { Events } from "../events";

@ObjectType()
@Entity()
export class EventsPageVisit extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    @Field( () => ID )
    id: string;

    @Field()
    @Column()
    guest: boolean;

    @Field( () => Users, { nullable: true } )
    @ManyToOne( () => Users, u => u.eventPageVisited, { onDelete: 'CASCADE' })
    user?: Users | null; 

    @Field( () => [ Events ])
    @ManyToOne( () => Events, o => o.pageVisitors, { onDelete: 'CASCADE' })
    event: Events;

    @Field()
    @CreateDateColumn()
    dateCreated: Date;
}
