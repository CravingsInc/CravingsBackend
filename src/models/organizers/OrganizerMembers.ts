import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, BaseEntity, UpdateDateColumn, OneToMany } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Organizers } from "./Organizers";
import { OrganizerMemberPasswordChange } from "./OrganizerMemberPasswordChange";

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

    @Column()
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

    @OneToMany( () => OrganizerMemberPasswordChange, pwc => pwc.member )
    passwordChangeHistory: OrganizerMemberPasswordChange[];

    @Field()
    @CreateDateColumn()
    createdDate: Date;

    @Field()
    @UpdateDateColumn()
    updatedDate: Date;
    
}
