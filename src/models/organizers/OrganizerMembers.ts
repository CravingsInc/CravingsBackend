import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, BaseEntity, UpdateDateColumn } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Organizers } from "./Organizers";

export type OrganizerMembersTitle = 'Admin' | "Member" | "Guest"

@Entity()
@ObjectType()
export class OrganizerMembers extends BaseEntity {
    @Field( () => ID )
    @PrimaryGeneratedColumn( "uuid" )
    id: string;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column()
    email: string;

    @Field()
    @Column()
    phoneNumber: string;

    @Field()
    @Column()
    title: OrganizerMembersTitle;

    @Field()
    password: string;

    @Field()
    @Column()
    accepted: boolean;

    @Field()
    @Column({ default: () => "CURRENT_TIMESTAMP" })
    dateJoined: Date;

    @Field()
    @Column({ default: '/home-header.png', nullable: true })
    profilePicture: string;

    @Field( () => Organizers )
    @ManyToOne( () => Organizers, o => o.members, { onDelete: "CASCADE" } )
    organizer: Organizers;

    @Field()
    @CreateDateColumn()
    createdDate: Date;

    @Field()
    @UpdateDateColumn()
    updatedDate: Date;
    
}
