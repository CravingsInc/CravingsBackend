import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, ManyToOne } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Organizers } from "../Organizers";
import { Users } from "../../users";

@ObjectType()
@Entity()
export class OrganizerPageVisit extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    @Field( () => ID )
    id: string;

    @Field()
    @Column()
    guest: boolean;

    @Field( () => Users, { nullable: true } )
    @ManyToOne( () => Users, u => u.organizerPageVisited, { onDelete: 'CASCADE' })
    user?: Users | null; 

    @Field( () => [ Organizers ])
    @ManyToOne( () => Organizers, o => o.pageVisitors, { onDelete: 'CASCADE' })
    organizer: Organizers;

    @Field()
    @CreateDateColumn()
    dateCreated: Date;
}
