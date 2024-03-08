import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity, UpdateDateColumn, ManyToOne } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Users } from "../users";
import { Organizers } from "./Organizers";

@ObjectType()
@Entity()
export class OrganizersFollowers extends BaseEntity {
    @Field( () => ID )
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field( () => Users)
    @ManyToOne( () => Users, u => u.organizerFollowing, { onDelete: 'CASCADE' })
    user: Users;

    @Field( () => Users )
    @ManyToOne( () => Organizers, o => o.followers, { onDelete: 'CASCADE' } )
    organizer: Organizers;

    @CreateDateColumn()
    created: Date;
}
